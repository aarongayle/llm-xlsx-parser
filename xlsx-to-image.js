import { writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { convertExcelToStyledHTML } from "./sandbox.js";

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
  try {
    console.log(`📖 Reading XLSX file: ${xlsxPath}`);

    // Use the robust styled HTML converter from sandbox.js
    const styledHTML = await convertExcelToStyledHTML(xlsxPath, null);

    // Save HTML file
    writeFileSync(outputPath, styledHTML);

    console.log(`✅ HTML file saved successfully: ${outputPath}`);
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
