import fs from "fs";

/**
 * Demo script to show how the test validation works
 * This reads the existing analysis.txt file and demonstrates the validation logic
 */

const EXPECTED_GAS_PRICES = [
  6.73, 8.46, 9.17, 15.8, 11.26, 2.98, 3.6, 3.68, 3.56, 1.59, 1.98, 2.47, 3.79,
];

const EXPECTED_WORKING_INTEREST = [
  1492932, 1855968, 1843238, 2882928, 1730478, 453757, 597380, 647432, 809220,
  393202, 157421, 377842, 696481,
];

function demonstrateValidation() {
  console.log(
    "🔍 Demonstrating test validation logic using existing analysis.txt..."
  );

  // Read the existing analysis output
  const analysisPath = "output/analysis.txt";
  if (!fs.existsSync(analysisPath)) {
    console.error("❌ analysis.txt not found. Please run the example first.");
    process.exit(1);
  }

  const outputContent = fs.readFileSync(analysisPath, "utf8");

  // Extract gas prices using the same regex as the test
  console.log("\n📈 Extracting Gas Prices...");
  const gasPriceRegex = /PRICES:\s*Gas\s*\([^)]+\):\s*([\d.]+)/g;
  const extractedGasPrices = [];
  let match;

  while ((match = gasPriceRegex.exec(outputContent)) !== null) {
    extractedGasPrices.push(parseFloat(match[1]));
  }

  // Extract working interest values using the same regex as the test
  console.log("💰 Extracting Working Interest Values...");
  const workingInterestRegex = /NET TO WI:\s*([\d.]+)/g;
  const extractedWorkingInterest = [];

  while ((match = workingInterestRegex.exec(outputContent)) !== null) {
    extractedWorkingInterest.push(parseFloat(match[1]));
  }

  // Demonstrate gas price validation
  console.log("\n📊 Gas Price Validation Results:");
  console.log("=".repeat(60));
  console.log("Period | Expected | Extracted | Status");
  console.log("-".repeat(60));

  for (
    let i = 0;
    i < Math.max(EXPECTED_GAS_PRICES.length, extractedGasPrices.length);
    i++
  ) {
    const expected = EXPECTED_GAS_PRICES[i];
    const actual = extractedGasPrices[i];
    const tolerance = 0.01;

    if (expected !== undefined && actual !== undefined) {
      const status =
        Math.abs(actual - expected) <= tolerance ? "✅ PASS" : "❌ FAIL";
      console.log(
        `Q${i + 1}     | ${expected.toFixed(2).padStart(8)} | ${actual
          .toFixed(2)
          .padStart(9)} | ${status}`
      );
    } else if (expected !== undefined) {
      console.log(
        `Q${i + 1}     | ${expected
          .toFixed(2)
          .padStart(8)} | ${"MISSING".padStart(9)} | ❌ FAIL`
      );
    } else if (actual !== undefined) {
      console.log(
        `Q${i + 1}     | ${"MISSING".padStart(8)} | ${actual
          .toFixed(2)
          .padStart(9)} | ❌ FAIL`
      );
    }
  }

  // Demonstrate working interest validation
  console.log("\n💼 Working Interest Validation Results:");
  console.log("=".repeat(60));
  console.log("Period | Expected | Extracted | Status");
  console.log("-".repeat(60));

  for (
    let i = 0;
    i <
    Math.max(EXPECTED_WORKING_INTEREST.length, extractedWorkingInterest.length);
    i++
  ) {
    const expected = EXPECTED_WORKING_INTEREST[i];
    const actual = extractedWorkingInterest[i];
    const tolerance = 1;

    if (expected !== undefined && actual !== undefined) {
      const status =
        Math.abs(actual - expected) <= tolerance ? "✅ PASS" : "❌ FAIL";
      console.log(
        `Q${i + 1}     | ${expected.toString().padStart(8)} | ${actual
          .toString()
          .padStart(9)} | ${status}`
      );
    } else if (expected !== undefined) {
      console.log(
        `Q${i + 1}     | ${expected
          .toString()
          .padStart(8)} | ${"MISSING".padStart(9)} | ❌ FAIL`
      );
    } else if (actual !== undefined) {
      console.log(
        `Q${i + 1}     | ${"MISSING".padStart(8)} | ${actual
          .toString()
          .padStart(9)} | ❌ FAIL`
      );
    }
  }

  // Summary
  const gasPricesValid =
    extractedGasPrices.length === EXPECTED_GAS_PRICES.length &&
    extractedGasPrices.every(
      (price, i) => Math.abs(price - EXPECTED_GAS_PRICES[i]) <= 0.01
    );

  const workingInterestValid =
    extractedWorkingInterest.length === EXPECTED_WORKING_INTEREST.length &&
    extractedWorkingInterest.every(
      (wi, i) => Math.abs(wi - EXPECTED_WORKING_INTEREST[i]) <= 1
    );

  console.log("\n📋 Validation Summary:");
  console.log("=".repeat(40));
  console.log(`Gas Prices: ${gasPricesValid ? "✅ PASS" : "❌ FAIL"}`);
  console.log(
    `Working Interest: ${workingInterestValid ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Overall: ${gasPricesValid && workingInterestValid ? "✅ PASS" : "❌ FAIL"}`
  );

  console.log(
    "\n🔧 This demonstrates the validation logic used in the test suite."
  );
  console.log(
    "The actual tests run the analysis and then perform these same validations."
  );
}

demonstrateValidation();
