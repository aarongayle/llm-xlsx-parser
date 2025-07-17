import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { convertXlsxToImage } from "./xlsx-to-image.js";

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
  let browser;

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

    // Step 2: Convert HTML to PNG using Playwright programmatically
    console.log("\n📸 Step 2: Converting HTML to PNG...");
    console.log(
      `📏 Using viewport: ${viewportWidth}x${viewportHeight}, Full page: ${fullPage}`
    );

    // Launch browser
    console.log("🔧 Launching browser...");
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
      },
    });

    const page = await context.newPage();

    // Navigate to the HTML file
    const fileUrl = `file://${path.resolve(htmlPath)}`;
    console.log(`🌐 Navigating to: ${fileUrl}`);
    await page.goto(fileUrl);

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Take screenshot
    console.log(`📸 Taking screenshot...`);
    await page.screenshot({
      path: imagePath,
      fullPage: fullPage,
    });

    // Close browser
    await browser.close();
    browser = null;

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

    // Clean up browser if it's still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn(`⚠️  Could not close browser: ${closeError.message}`);
      }
    }

    // Check if it's a Playwright issue
    if (
      error.message.includes("playwright") ||
      error.message.includes("browser")
    ) {
      console.log("\n🔧 To fix Playwright issues, try:");
      console.log("   npx playwright install");
      console.log("   or");
      console.log("   npx playwright install chromium");
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
