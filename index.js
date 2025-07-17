import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs, { readFileSync, writeFileSync } from "fs";
import path from "path";
import { read, utils } from "xlsx";
import { createImageFromXlsx } from "./create-image.js";

dotenv.config();
// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read the Excel file
const workbook = read(readFileSync("examples/LOS.xlsx"));

// Get the first sheet name
const firstSheetName = workbook.SheetNames[0];
console.log(`Reading sheet: ${firstSheetName}`);

// Get the first sheet
const worksheet = workbook.Sheets[firstSheetName];

// Convert to CSV format
const csvData = utils.sheet_to_csv(worksheet);

// Save CSV to file
writeFileSync("./output/output.csv", csvData);
console.log("CSV saved to output.csv");

// Also convert to JSON for easier processing
const jsonData = utils.sheet_to_json(worksheet, {
  header: 1, // Use first row as header
  defval: "", // Default value for empty cells
});

// Save JSON to file
writeFileSync("./output/output.json", JSON.stringify(jsonData, null, 2));
console.log("JSON saved to output.json");

// Display some info about the data
console.log(`\nSheet info:`);
console.log(`- Sheet name: ${firstSheetName}`);
console.log(`- Total rows: ${jsonData.length}`);
console.log(`- Total columns: ${jsonData[0]?.length || 0}`);

// Show first few rows
console.log("\nFirst 5 rows:");
jsonData.slice(0, 5).forEach((row, index) => {
  console.log(`Row ${index + 1}:`, row.slice(0, 5), "...");
});

// NEW: Convert XLSX to image
console.log("\n🖼️  Converting XLSX to image...");
let imagePath;
try {
  imagePath = await createImageFromXlsx(
    "examples/LOS.xlsx",
    "./output/spreadsheet.png",
    {
      maxRows: 50,
      maxCols: 40,
      fontSize: 8,
      cellPadding: 2,
      viewportWidth: 1920,
      viewportHeight: 1080,
      fullPage: true,
    }
  );
  console.log(`✅ Image saved to: ${imagePath}`);
  console.log("\n📋 Summary:");
  console.log("- CSV: output.csv");
  console.log("- JSON: output.json");
  console.log(`- Image: ${imagePath}`);
  console.log("\n💡 The image can now be sent to an LLM for visual analysis!");
} catch (error) {
  console.error("❌ Failed to convert XLSX to image:", error.message);
}

// Function to convert tabular data to record format for better LLM understanding
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

// NEW: Send all outputs to Gemini for analysis
console.log("\n🤖 Sending data to Gemini for analysis...");
try {
  // Upload the image file
  const myfile = await ai.files.upload({
    file: path.resolve(imagePath),
    config: { mimeType: "image/png" },
  });
  console.log("✅ Image uploaded to Gemini");

  // Format the data as records for better LLM understanding
  const recordFormattedData = formatAsRecords(jsonData);

  // System prompt for serialization engineer
  const systemPrompt = fs.readFileSync("./system-prompt.txt", "utf8");

  // Create the content for Gemini
  const textContent = [
    "**SPREADSHEET DATA (Record Format):**\n" + recordFormattedData,
    "\n\n**CSV DATA:**\n" + csvData,
    "\n\n**REQUEST:**\nPlease analyze this spreadsheet data in all its forms (visual image, structured records, and raw CSV). Provide insights about:\n1. The structure and content of the data\n2. Any patterns or relationships you notice\n3. Data quality observations\n4. Key insights or summaries\n5. Any recommendations for data processing or analysis",
  ].join("");

  const result = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      {
        parts: [
          { fileData: { mimeType: myfile.mimeType, fileUri: myfile.uri } },
          { text: textContent },
        ],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
    },
  });

  console.log("\n🎯 Gemini Analysis Results:");
  console.log("=".repeat(50));
  console.log(result.text);
  fs.writeFileSync("./output/output.txt", result.text);
} catch (error) {
  console.error("❌ Failed to analyze with Gemini:", error.message);
  console.error(
    "Make sure GEMINI_API_KEY is set in your environment variables"
  );
}
