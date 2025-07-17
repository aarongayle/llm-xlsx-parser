import { exec } from "child_process";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { convertXlsxToImage } from "./xlsx-to-image.js";

const execAsync = promisify(exec);

/**
 * Converts XLSX to image with full automation
 * @param {string} xlsxPath - Path to XLSX file
 * @param {string} imagePath - Path for output image
 * @param {Object} options - Configuration options
 */
async function createImageFromXlsx(
  xlsxPath,
  imagePath = "output.png",
  options = {}
) {
  try {
    console.log("🚀 XLSX to Image Converter (Automated)");
    console.log("=".repeat(50));

    // Extract viewport options with defaults
    const {
      viewportWidth = 1920,
      viewportHeight = 1080,
      fullPage = true,
      ...htmlOptions
    } = options;

    // Step 1: Convert XLSX to HTML
    console.log("\n📊 Step 1: Converting XLSX to HTML...");
    const htmlPath = await convertXlsxToImage(
      xlsxPath,
      "temp-table.html",
      htmlOptions
    );

    // Step 2: Convert HTML to PNG using Playwright with proper viewport
    console.log("\n📸 Step 2: Converting HTML to PNG...");
    console.log(
      `📏 Using viewport: ${viewportWidth}x${viewportHeight}, Full page: ${fullPage}`
    );

    const playwrightCmd = [
      "npx playwright screenshot",
      `--viewport-size=${viewportWidth},${viewportHeight}`,
      fullPage ? "--full-page" : "",
      `"${htmlPath}"`,
      `"${imagePath}"`,
    ]
      .filter(Boolean)
      .join(" ");

    console.log(`🔧 Running: ${playwrightCmd}`);

    const { stdout, stderr } = await execAsync(playwrightCmd);

    if (stderr && !stderr.includes("Navigating to")) {
      console.warn("⚠️  Playwright warning:", stderr);
    }

    console.log(`✅ Image created successfully: ${imagePath}`);

    // Clean up temporary HTML file
    try {
      const fs = await import("fs");
      fs.unlinkSync(htmlPath);
      console.log(`🧹 Cleaned up temporary file: ${htmlPath}`);
    } catch (cleanupError) {
      console.warn(
        `⚠️  Could not clean up temporary file: ${cleanupError.message}`
      );
    }

    console.log(
      "\n🎉 Complete! Your XLSX file has been converted to an image."
    );
    console.log(`📁 Output: ${imagePath}`);
    console.log("\n💡 You can now send this image to an LLM for analysis!");

    return imagePath;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    // Check if it's a Playwright issue
    if (error.message.includes("playwright")) {
      console.log("\n🔧 To fix Playwright issues, run:");
      console.log("   npx playwright install");
    }

    throw error;
  }
}

// If running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const xlsxFile = process.argv[2] || "examples/LOS.xlsx";
  const outputFile = process.argv[3] || "output.png";

  createImageFromXlsx(xlsxFile, outputFile, {
    maxRows: 50,
    maxCols: 15,
    fontSize: 12,
    cellPadding: 8,
    viewportWidth: 1920,
    viewportHeight: 1080,
    fullPage: true,
  }).catch((error) => {
    console.error(`\n❌ Failed to create image: ${error.message}`);
    process.exit(1);
  });
}

export { createImageFromXlsx };
