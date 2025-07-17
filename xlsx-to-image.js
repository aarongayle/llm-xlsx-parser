import { readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { read, utils } from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Converts XLSX file to an HTML file that can be easily screenshot
 * @param {string} xlsxPath - Path to the XLSX file
 * @param {string} outputPath - Path where the HTML file will be saved
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Path to the generated HTML file
 */
async function xlsxToHtml(xlsxPath, outputPath = "output.html", options = {}) {
  const {
    maxRows = 100,
    maxCols = 20,
    cellPadding = 8,
    fontSize = 12,
    headerColor = "#f0f0f0",
    borderColor = "#cccccc",
    textColor = "#333333",
  } = options;

  try {
    console.log(`📖 Reading XLSX file: ${xlsxPath}`);

    // Read the Excel file
    const workbook = read(readFileSync(xlsxPath));
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log(`📊 Processing sheet: ${firstSheetName}`);

    // Convert to JSON with proper handling
    const jsonData = utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      range: undefined, // Get all data
    });

    // Limit data size for performance
    const limitedData = jsonData
      .slice(0, maxRows)
      .map((row) => (Array.isArray(row) ? row.slice(0, maxCols) : []));

    console.log(
      `📏 Data size: ${limitedData.length} rows x ${
        limitedData[0]?.length || 0
      } columns`
    );

    // Generate HTML content
    const htmlContent = generateTableHTML(limitedData, {
      cellPadding,
      fontSize,
      headerColor,
      borderColor,
      textColor,
      title: `Sheet: ${firstSheetName}`,
    });

    // Save HTML file
    writeFileSync(outputPath, htmlContent);

    console.log(`✅ HTML file saved successfully: ${outputPath}`);
    console.log(
      `📊 Captured ${limitedData.length} rows and ${
        limitedData[0]?.length || 0
      } columns`
    );
    console.log(`\n💡 Instructions:`);
    console.log(`1. Open ${outputPath} in your browser`);
    console.log(`2. Take a screenshot (Ctrl+Shift+S in most browsers)`);
    console.log(`3. Save as PNG/JPG for LLM processing`);
    console.log(`\nAlternatively, use browser automation tools like:`);
    console.log(
      `- Playwright: npx playwright screenshot ${outputPath} output.png`
    );
    console.log(
      `- Chrome headless: chrome --headless --screenshot=${outputPath} output.png`
    );

    return outputPath;
  } catch (error) {
    console.error(`❌ Error converting XLSX to HTML: ${error.message}`);
    throw error;
  }
}

/**
 * Generates HTML table from JSON data
 */
function generateTableHTML(data, options) {
  const {
    cellPadding = 8,
    fontSize = 12,
    headerColor = "#f0f0f0",
    borderColor = "#cccccc",
    textColor = "#333333",
    title = "Excel Data",
  } = options;

  if (!data || data.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            background: white;
          }
          .no-data { 
            text-align: center; 
            color: #666; 
            font-size: 18px; 
            padding: 50px;
          }
        </style>
      </head>
      <body>
        <div class="no-data">No data found in the spreadsheet</div>
      </body>
      </html>
    `;
  }

  const maxCols = Math.max(...data.map((row) => row.length));

  let tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.4;
          color: ${textColor};
          background: white;
          padding: 20px;
          margin: 0;
        }
        
        .container {
          max-width: 100%;
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 20px;
        }
        
        h1 {
          margin-bottom: 20px;
          font-size: ${fontSize + 6}px;
          color: #333;
          text-align: center;
          font-weight: 600;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        .instructions {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
          font-size: ${fontSize - 1}px;
          color: #495057;
        }
        
        .instructions h3 {
          margin-bottom: 10px;
          color: #343a40;
          font-size: ${fontSize + 1}px;
        }
        
        .instructions ul {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        
        .instructions li {
          margin-bottom: 5px;
        }
        
        .instructions code {
          background: #e9ecef;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: ${fontSize - 2}px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        th, td {
          border: 1px solid ${borderColor};
          padding: ${cellPadding}px;
          text-align: left;
          vertical-align: top;
          word-wrap: break-word;
          max-width: 200px;
          min-width: 60px;
        }
        
        th {
          background-color: ${headerColor};
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 10;
          text-align: center;
          border-bottom: 2px solid ${borderColor};
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tr:hover {
          background-color: #f5f5f5;
        }
        
        .cell-content {
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          max-width: 180px;
        }
        
        .row-number {
          background-color: #e9ecef;
          font-weight: bold;
          text-align: center;
          width: 50px;
          min-width: 50px;
          color: #6c757d;
        }
        
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #6c757d;
          font-size: ${fontSize - 2}px;
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
        
        /* Print styles */
        @media print {
          body { 
            padding: 0; 
            background: white;
          }
          .container { 
            box-shadow: none;
            padding: 10px;
          }
          .instructions {
            display: none;
          }
          .footer {
            display: none;
          }
        }
        
        /* Responsive design */
        @media screen and (max-width: 768px) {
          .container {
            padding: 10px;
          }
          th, td {
            padding: ${Math.max(4, cellPadding - 2)}px;
            font-size: ${fontSize - 1}px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <table>
  `;

  // Add header row if data exists
  if (data.length > 0) {
    tableHTML += '<thead><tr><th class="row-number">#</th>';

    // Create column headers (A, B, C, etc.)
    for (let i = 0; i < maxCols; i++) {
      const colLetter = String.fromCharCode(65 + (i % 26));
      tableHTML += `<th>${colLetter}</th>`;
    }
    tableHTML += "</tr></thead>";
  }

  // Add data rows
  tableHTML += "<tbody>";
  data.forEach((row, rowIndex) => {
    tableHTML += `<tr><td class="row-number">${rowIndex + 1}</td>`;

    for (let colIndex = 0; colIndex < maxCols; colIndex++) {
      const cellValue = row[colIndex] || "";
      const displayValue =
        String(cellValue).length > 50
          ? String(cellValue).substring(0, 50) + "..."
          : String(cellValue);

      const safeValue = String(cellValue)
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const safeDisplayValue = displayValue
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      tableHTML += `<td><div class="cell-content" title="${safeValue}">${safeDisplayValue}</div></td>`;
    }

    tableHTML += "</tr>";
  });

  tableHTML += `
        </tbody>
        </table>
        
        <div class="footer">
          <p>Generated from Excel file • ${data.length} rows × ${maxCols} columns • Ready for LLM processing</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return tableHTML;
}

/**
 * Export the main function
 */
export async function convertXlsxToImage(xlsxPath, outputPath, options) {
  // For now, generate HTML - user can screenshot manually or use browser automation
  const htmlPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, ".html");
  return await xlsxToHtml(xlsxPath, htmlPath, options);
}

// If running directly, convert the example file
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("🚀 XLSX to HTML Converter");
  console.log("=".repeat(40));

  convertXlsxToImage("examples/LOS.xlsx", "output.html", {
    maxRows: 50,
    maxCols: 15,
    fontSize: 13,
    cellPadding: 10,
  })
    .then((htmlPath) => {
      console.log(`\n✅ Success! HTML file saved to: ${htmlPath}`);
      console.log("\n🌐 Next steps:");
      console.log("1. Open the HTML file in your browser");
      console.log("2. Take a screenshot for LLM processing");
      console.log(
        "3. Or use browser automation tools as shown in the instructions"
      );
    })
    .catch((error) => {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    });
}
