import dotenv from "dotenv";
import analyzeXlsx from "./index.js";

dotenv.config();

// Example usage of the llm-xlsx-parser module
async function runExample() {
  try {
    console.log("🚀 Starting XLSX analysis example...");

    const result = await analyzeXlsx(
      "examples/LOS.xlsx",
      "output/analysis.txt",
      {
        maxRows: 50,
        maxCols: 40,
        viewportWidth: 1920,
        viewportHeight: 1080,
        fontSize: 8,
        cellPadding: 2,
        fullPage: true,
      }
    );

    console.log("\n✅ Analysis complete!");
    console.log("📄 Analysis saved to: output/analysis.txt");
    console.log("\n📊 Analysis preview:");
    console.log("=".repeat(50));
    console.log(result.substring(0, 500) + "...");
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.message.includes("Gemini API key")) {
      console.log("\n💡 Make sure to:");
      console.log("1. Create a .env file");
      console.log("2. Add your Gemini API key: GEMINI_API_KEY=your_key_here");
    }
  }
}

runExample();
