import fs from "fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import analyzeXlsx from "../index.js";

describe("LLM XLSX Parser", () => {
  const testOutputPath = "test/test-output.txt";
  const xlsxPath = "examples/LOS.xlsx";

  // Expected gas prices and working interest values from the analysis
  const expectedGasPrices = [
    6.73, 8.46, 9.17, 15.8, 11.26, 2.98, 3.6, 3.68, 3.56, 1.59, 1.98, 2.47,
    3.79,
  ];

  const expectedWorkingInterest = [
    1492932, 1855968, 1843238, 2882928, 1730478, 453757, 597380, 647432, 809220,
    393202, 157421, 377842, 696481,
  ];

  beforeAll(async () => {
    // Ensure test directory exists
    if (!fs.existsSync("test")) {
      fs.mkdirSync("test");
    }
  });

  afterAll(() => {
    // Clean up test output file
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  it("should analyze XLSX file and return correct gas prices and working interest values", async () => {
    // Skip test if no API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping test: GEMINI_API_KEY not found in environment");
      return;
    }

    // Run the analysis
    const result = await analyzeXlsx(xlsxPath, testOutputPath, {
      maxRows: 50,
      maxCols: 40,
      viewportWidth: 1920,
      viewportHeight: 1080,
      fontSize: 8,
      cellPadding: 2,
      fullPage: true,
      model: "gemini-2.5-pro",
    });

    // Verify the analysis was completed
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);

    // Verify output file was created
    expect(fs.existsSync(testOutputPath)).toBe(true);

    // Read and parse the output file
    const outputContent = fs.readFileSync(testOutputPath, "utf8");

    // Extract gas prices from the output
    const gasPriceRegex = /PRICES:\s*Gas\s*\([^)]+\):\s*([\d.]+)/g;
    const extractedGasPrices = [];
    let match;

    while ((match = gasPriceRegex.exec(outputContent)) !== null) {
      extractedGasPrices.push(parseFloat(match[1]));
    }

    // Extract working interest values from the output
    const workingInterestRegex = /NET TO WI:\s*([\d.]+)/g;
    const extractedWorkingInterest = [];

    while ((match = workingInterestRegex.exec(outputContent)) !== null) {
      extractedWorkingInterest.push(parseFloat(match[1]));
    }

    // Validate gas prices
    expect(extractedGasPrices).toHaveLength(expectedGasPrices.length);

    for (let i = 0; i < expectedGasPrices.length; i++) {
      expect(extractedGasPrices[i]).toBeCloseTo(expectedGasPrices[i], 2);
    }

    // Validate working interest values
    expect(extractedWorkingInterest).toHaveLength(
      expectedWorkingInterest.length
    );

    for (let i = 0; i < expectedWorkingInterest.length; i++) {
      expect(extractedWorkingInterest[i]).toBeCloseTo(
        expectedWorkingInterest[i],
        0
      );
    }

    console.log("✅ Gas prices validation passed");
    console.log("✅ Working interest validation passed");
  }, 60000); // 60 second timeout for API calls

  it("should handle missing API key gracefully", async () => {
    // Temporarily remove API key
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await analyzeXlsx(xlsxPath, testOutputPath, {
        model: "gemini-2.5-pro",
      });
      expect.fail("Should have thrown an error for missing API key");
    } catch (error) {
      expect(error.message).toContain("Gemini API key is required");
    } finally {
      // Restore API key
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });

  it("should handle invalid file path gracefully", async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping test: GEMINI_API_KEY not found in environment");
      return;
    }

    try {
      await analyzeXlsx("nonexistent.xlsx", testOutputPath, {
        model: "gemini-2.5-pro",
      });
      expect.fail("Should have thrown an error for invalid file path");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should validate data structure and patterns", async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping test: GEMINI_API_KEY not found in environment");
      return;
    }

    const result = await analyzeXlsx(xlsxPath, testOutputPath, {
      model: "gemini-2.5-pro",
    });
    const outputContent = fs.readFileSync(testOutputPath, "utf8");

    // Check for expected data structure patterns
    expect(outputContent).toMatch(/Period:\s*\d{4}\s*Q[1-4]/);
    expect(outputContent).toMatch(/VOLUMES:\s*Crude & Condensate/);
    expect(outputContent).toMatch(/VOLUMES:\s*Gas/);
    expect(outputContent).toMatch(/VOLUMES:\s*Natural Gas Liquids/);
    expect(outputContent).toMatch(/PRICES:\s*Gas/);
    expect(outputContent).toMatch(/NET TO WI:/);
    expect(outputContent).toMatch(/TOTAL INVESTMENT:/);

    // Verify we have the expected number of periods (13 quarters)
    const periodMatches = outputContent.match(/Period:\s*\d{4}\s*Q[1-4]/g);
    expect(periodMatches).toHaveLength(13);

    console.log("✅ Data structure validation passed");
  });

  it("should extract numeric values correctly with tolerance", async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping test: GEMINI_API_KEY not found in environment");
      return;
    }

    const result = await analyzeXlsx(xlsxPath, testOutputPath, {
      model: "gemini-2.5-pro",
    });
    const outputContent = fs.readFileSync(testOutputPath, "utf8");

    // Test that numeric values are parsed correctly
    const volumeRegex = /VOLUMES:\s*Gas\s*\([^)]+\):\s*([\d.]+)/g;
    const extractedVolumes = [];
    let match;

    while ((match = volumeRegex.exec(outputContent)) !== null) {
      const volume = parseFloat(match[1]);
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeLessThan(1000000); // Reasonable upper bound
      extractedVolumes.push(volume);
    }

    expect(extractedVolumes.length).toBeGreaterThan(0);

    // Check that revenue values are reasonable
    const revenueRegex = /REVENUE:\s*Gas:\s*([\d.]+)/g;
    const extractedRevenues = [];

    while ((match = revenueRegex.exec(outputContent)) !== null) {
      const revenue = parseFloat(match[1]);
      expect(revenue).toBeGreaterThan(0);
      extractedRevenues.push(revenue);
    }

    expect(extractedRevenues.length).toBeGreaterThan(0);

    console.log("✅ Numeric value extraction validation passed");
  });
});
