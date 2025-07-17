import fs from "fs";
import analyzeXlsx from "../index.js";

/**
 * Standalone validation script for gas prices and working interest values
 * This script runs the analysis and validates the specific values mentioned in the requirements
 */

const EXPECTED_GAS_PRICES = [
  6.73, 8.46, 9.17, 15.8, 11.26, 2.98, 3.6, 3.68, 3.56, 1.59, 1.98, 2.47, 3.79,
];

const EXPECTED_WORKING_INTEREST = [
  1492932, 1855968, 1843238, 2882928, 1730478, 453757, 597380, 647432, 809220,
  393202, 157421, 377842, 696481,
];

async function validateSpecificValues() {
  console.log(
    "🚀 Starting validation of gas prices and working interest values..."
  );

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("Please add your Gemini API key to your .env file");
    process.exit(1);
  }

  const xlsxPath = "examples/LOS.xlsx";
  const outputPath = "test/validation-output.txt";

  try {
    // Ensure test directory exists
    if (!fs.existsSync("test")) {
      fs.mkdirSync("test");
    }

    // Run the analysis
    console.log("📊 Running XLSX analysis...");
    const result = await analyzeXlsx(xlsxPath, outputPath, {
      maxRows: 50,
      maxCols: 40,
      viewportWidth: 1920,
      viewportHeight: 1080,
      fontSize: 8,
      cellPadding: 2,
      fullPage: true,
    });

    // Read the output
    const outputContent = fs.readFileSync(outputPath, "utf8");

    // Extract gas prices
    console.log("🔍 Extracting gas prices...");
    const gasPriceRegex = /PRICES:\s*Gas\s*\([^)]+\):\s*([\d.]+)/g;
    const extractedGasPrices = [];
    let match;

    while ((match = gasPriceRegex.exec(outputContent)) !== null) {
      extractedGasPrices.push(parseFloat(match[1]));
    }

    // Extract working interest values
    console.log("🔍 Extracting working interest values...");
    const workingInterestRegex = /NET TO WI:\s*([\d.]+)/g;
    const extractedWorkingInterest = [];

    while ((match = workingInterestRegex.exec(outputContent)) !== null) {
      extractedWorkingInterest.push(parseFloat(match[1]));
    }

    // Validate gas prices
    console.log("\n📈 Gas Prices Validation:");
    console.log("=".repeat(50));

    let gasPricesValid = true;
    if (extractedGasPrices.length !== EXPECTED_GAS_PRICES.length) {
      console.error(
        `❌ Expected ${EXPECTED_GAS_PRICES.length} gas prices, got ${extractedGasPrices.length}`
      );
      gasPricesValid = false;
    } else {
      for (let i = 0; i < EXPECTED_GAS_PRICES.length; i++) {
        const expected = EXPECTED_GAS_PRICES[i];
        const actual = extractedGasPrices[i];
        const tolerance = 0.01; // 1 cent tolerance

        if (Math.abs(actual - expected) <= tolerance) {
          console.log(
            `✅ Period ${i + 1}: Expected ${expected}, Got ${actual} (✓)`
          );
        } else {
          console.log(
            `❌ Period ${i + 1}: Expected ${expected}, Got ${actual} (✗)`
          );
          gasPricesValid = false;
        }
      }
    }

    // Validate working interest values
    console.log("\n💰 Working Interest Validation:");
    console.log("=".repeat(50));

    let workingInterestValid = true;
    if (extractedWorkingInterest.length !== EXPECTED_WORKING_INTEREST.length) {
      console.error(
        `❌ Expected ${EXPECTED_WORKING_INTEREST.length} working interest values, got ${extractedWorkingInterest.length}`
      );
      workingInterestValid = false;
    } else {
      for (let i = 0; i < EXPECTED_WORKING_INTEREST.length; i++) {
        const expected = EXPECTED_WORKING_INTEREST[i];
        const actual = extractedWorkingInterest[i];
        const tolerance = 1; // 1 dollar tolerance

        if (Math.abs(actual - expected) <= tolerance) {
          console.log(
            `✅ Period ${i + 1}: Expected ${expected}, Got ${actual} (✓)`
          );
        } else {
          console.log(
            `❌ Period ${i + 1}: Expected ${expected}, Got ${actual} (✗)`
          );
          workingInterestValid = false;
        }
      }
    }

    // Summary
    console.log("\n📋 Validation Summary:");
    console.log("=".repeat(50));

    if (gasPricesValid && workingInterestValid) {
      console.log("🎉 All validations passed!");
      console.log("✅ Gas prices are correct");
      console.log("✅ Working interest values are correct");
    } else {
      console.log("❌ Some validations failed:");
      if (!gasPricesValid) console.log("  - Gas prices validation failed");
      if (!workingInterestValid)
        console.log("  - Working interest validation failed");
    }

    // Clean up
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    process.exit(gasPricesValid && workingInterestValid ? 0 : 1);
  } catch (error) {
    console.error("❌ Error during validation:", error.message);
    process.exit(1);
  }
}

validateSpecificValues();
