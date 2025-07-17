import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { read, utils } from "xlsx";
import { createImageFromXlsx } from "./create-image.js";

dotenv.config();

// Default system prompt embedded in the module
const DEFAULT_SYSTEM_PROMPT = `You are a serialization engineer. Your role is to take multiple forms of the same data (CSV, JSON, and visual image) and analyze them to create the most comprehensive understanding possible. 

You excel at:
1. Reading information from top to bottom rather than side to side
2. Recognizing patterns in repeating record structures
3. Understanding column relationships even in large datasets
4. Combining visual, structured, and raw data insights

You will output the data in a format that is easiest for LLMs to understand.

For example let's say have a table like:

| name  | age | favorite color |
| ----- | --- | -------------- |
| Steve | 56  | red            |
| Ava   | 1   | pink           |
| Donna | 50  | purple         |

The way you want to present the information to the model is as:

\`\`\`
name: Steve
age: 56
favorite color: red

name: Ava
age: 1
favorite color: pink

name: Donna
age: 50
favorite color: purple
\`\`\`

You do not need to include any insites or observations about the data. Your job only involves analysis so far as it is helpful to understand the spacial relationsip between data in rows and columns.`;

/**
 * Function to convert tabular data to record format for better LLM understanding
 * @param {Array} jsonData - Array of arrays representing the spreadsheet data
 * @returns {string} Formatted record data
 */
function formatAsRecords(jsonData) {
  if (!jsonData || jsonData.length === 0) return "";

  const headers = jsonData[0];
  const rows = jsonData.slice(1);

  return rows
    .map((row) => {
      return headers
        .map((header, index) => {
          const value = row[index] || "";
          return `${header}: ${value}`;
        })
        .join("\n");
    })
    .join("\n\n");
}

/**
 * Main function to analyze XLSX files using LLM
 * @param {string} xlsxPath - Path to the XLSX file
 * @param {string} outputPath - Path where the analysis will be saved
 * @param {Object} options - Configuration options
 * @param {number} [options.maxRows=50] - Maximum rows to process for image
 * @param {number} [options.maxCols=40] - Maximum columns to process for image
 * @param {number} [options.viewportWidth=1920] - Browser viewport width for image generation
 * @param {number} [options.viewportHeight=1080] - Browser viewport height for image generation
 * @param {number} [options.fontSize=8] - Font size for image generation
 * @param {number} [options.cellPadding=2] - Cell padding for image generation
 * @param {boolean} [options.fullPage=true] - Whether to capture full page for image
 * @param {boolean} [options.sendImage=true] - Whether to include visual image in analysis
 * @param {boolean} [options.sendCSV=true] - Whether to include CSV data in analysis
 * @param {boolean} [options.sendJSON=true] - Whether to include JSON record data in analysis
 * @param {string} [options.systemPrompt] - Custom system prompt for LLM analysis
 * @param {string} [options.geminiApiKey] - Gemini API key (if not in environment)
 * @param {string} [options.model="gemini-2.5-pro"] - Google AI model to use for analysis
 * @returns {Promise<string>} The analysis result text
 */
async function analyzeXlsx(xlsxPath, outputPath, options = {}) {
  const {
    maxRows = 50,
    maxCols = 40,
    viewportWidth = 1920,
    viewportHeight = 1080,
    fontSize = 8,
    cellPadding = 2,
    fullPage = true,
    sendImage = true,
    sendCSV = true,
    sendJSON = true,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    geminiApiKey = process.env.GEMINI_API_KEY,
    model = "gemini-2.5-pro",
  } = options;

  if (!geminiApiKey) {
    throw new Error(
      "Gemini API key is required. Set GEMINI_API_KEY environment variable or pass it in options."
    );
  }

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    // Read the Excel file
    const workbook = read(fs.readFileSync(xlsxPath));
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to CSV format
    const csvData = utils.sheet_to_csv(worksheet);

    // Convert to JSON for processing
    const jsonData = utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as header
      defval: "", // Default value for empty cells
    });

    let imagePath;
    let myfile;

    // Create temporary image for LLM analysis if sendImage is true
    if (sendImage) {
      const tempImagePath = path.join(
        path.dirname(outputPath),
        `temp-${Date.now()}.png`
      );

      console.log("🖼️  Converting XLSX to image...");
      imagePath = await createImageFromXlsx(xlsxPath, tempImagePath, {
        maxRows,
        maxCols,
        fontSize,
        cellPadding,
        viewportWidth,
        viewportHeight,
        fullPage,
      });

      // Upload the image file
      myfile = await ai.files.upload({
        file: path.resolve(imagePath),
        config: { mimeType: "image/png" },
      });
    }

    console.log("🤖 Sending data to Gemini for analysis...");

    // Build content parts array
    const contentParts = [];
    const textContentSections = [];

    // Add image if enabled
    if (sendImage && myfile) {
      contentParts.push({
        fileData: { mimeType: myfile.mimeType, fileUri: myfile.uri },
      });
    }

    // Add JSON record data if enabled
    if (sendJSON) {
      const recordFormattedData = formatAsRecords(jsonData);
      textContentSections.push(
        "**SPREADSHEET DATA (Record Format):**\n" + recordFormattedData
      );
    }

    // Add CSV data if enabled
    if (sendCSV) {
      textContentSections.push("**CSV DATA:**\n" + csvData);
    }

    // Build the text content
    const dataTypes = [];
    if (sendImage) dataTypes.push("visual image");
    if (sendJSON) dataTypes.push("structured records");
    if (sendCSV) dataTypes.push("raw CSV");

    const dataTypesText =
      dataTypes.length > 0
        ? `in all its forms (${dataTypes.join(", ")})`
        : "from the provided data";

    textContentSections.push(
      `\n\n**REQUEST:**\nPlease analyze this spreadsheet data ${dataTypesText}. Provide insights about:\n1. The structure and content of the data\n2. Any patterns or relationships you notice\n3. Data quality observations\n4. Key insights or summaries\n5. Any recommendations for data processing or analysis`
    );

    const textContent = textContentSections.join("\n\n");
    contentParts.push({ text: textContent });

    const result = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: contentParts,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0,
      },
    });

    const analysisText = result.text;

    // Save the analysis to the output file
    fs.writeFileSync(outputPath, analysisText);

    // Clean up temporary image file if it was created
    if (sendImage && imagePath) {
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn(
          `⚠️  Could not clean up temporary image file: ${cleanupError.message}`
        );
      }
    }

    console.log(`✅ Analysis saved to: ${outputPath}`);
    return analysisText;
  } catch (error) {
    console.error("❌ Failed to analyze XLSX:", error.message);
    throw error;
  }
}

export default analyzeXlsx;
