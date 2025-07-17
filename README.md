# LLM XLSX Parser

A Node.js module that converts Excel (XLSX) files into LLM-friendly formats. This package transforms spreadsheet data into multiple representations (visual images, CSV, and structured records) that Large Language Models can easily understand and process.

## Why This Package Exists

LLMs struggle with tabular data for three key reasons:

1. **Poor Spatial Awareness**: These models have difficulty reading information side-to-side and are much better at processing data from top to bottom.

2. **Pattern Recognition**: LLMs excel at recognizing patterns. The repeating record structure this package creates reinforces the model's inherent pattern-matching abilities.

3. **Distance Problem**: In traditional tables, there's often significant distance between column values (especially in row 100+) and their headers. By formatting data as records, every value is immediately paired with its column name.

> **Inspiration**: This package was inspired by discussions in the OpenAI community about [how to format Excel files best for API ingestion](https://community.openai.com/t/how-to-format-excel-files-best-for-api-ingestion/914316), where developers shared techniques for making tabular data more LLM-friendly.

## Features

- 📊 **Multi-format Conversion**: Transforms XLSX files into images, CSV, and structured records
- 🧠 **LLM-Optimized**: Formats data specifically for optimal LLM comprehension
- 🖼️ **Visual Processing**: Generates images to help LLMs understand spatial relationships
- ⚙️ **Configurable**: Customizable image generation and processing options
- 📦 **NPM Module**: Easy to integrate into existing projects

## Installation

```bash
npm install llm-xlsx-parser
```

## Setup

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set up your environment:

```bash
# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

Or pass the API key directly in the options.

> **Note**: While any Gemini model can be used, this author has only had success with `gemini-2.5-pro`.

## How It Works

The package converts traditional spreadsheet data like this:

| name  | age | favorite color |
| ----- | --- | -------------- |
| Steve | 56  | red            |
| Ava   | 1   | pink           |
| Donna | 50  | purple         |

Into this LLM-friendly format:

```
name: Steve
age: 56
favorite color: red

name: Ava
age: 1
favorite color: pink

name: Donna
age: 50
favorite color: purple
```

This transformation makes it much easier for LLMs to:

- Understand the relationship between values and their column names
- Process data in a top-to-bottom reading pattern
- Recognize the repeating record structure

## Usage

### Basic Usage

```javascript
import parseXlsx from "llm-xlsx-parser";

const result = await parseXlsx(
  "path/to/your/file.xlsx",
  "output/formatted-data.txt"
);

console.log(result); // LLM-formatted data
```

### Advanced Usage with Options

```javascript
import parseXlsx from "llm-xlsx-parser";

const result = await parseXlsx(
  "data/spreadsheet.xlsx",
  "output/formatted-data.txt",
  {
    maxRows: 100, // Maximum rows to process for image
    maxCols: 50, // Maximum columns to process for image
    viewportWidth: 1920, // Browser viewport width for image
    viewportHeight: 1080, // Browser viewport height for image
    fontSize: 10, // Font size for image generation
    cellPadding: 4, // Cell padding for image generation
    fullPage: true, // Capture full page screenshot
    geminiApiKey: "your-key", // API key (if not in environment)
    systemPrompt: "Custom formatting prompt...", // Custom system prompt
  }
);
```

## API Reference

### `parseXlsx(xlsxPath, outputPath, options)`

Converts an XLSX file into LLM-friendly formats.

#### Parameters

- **`xlsxPath`** (string): Path to the XLSX file to convert
- **`outputPath`** (string): Path where the formatted data will be saved
- **`options`** (object, optional): Configuration options

#### Options

| Option           | Type    | Default                      | Description                                     |
| ---------------- | ------- | ---------------------------- | ----------------------------------------------- |
| `maxRows`        | number  | `50`                         | Maximum rows to process for image generation    |
| `maxCols`        | number  | `40`                         | Maximum columns to process for image generation |
| `viewportWidth`  | number  | `1920`                       | Browser viewport width for image generation     |
| `viewportHeight` | number  | `1080`                       | Browser viewport height for image generation    |
| `fontSize`       | number  | `8`                          | Font size for image generation                  |
| `cellPadding`    | number  | `2`                          | Cell padding for image generation               |
| `fullPage`       | boolean | `true`                       | Whether to capture full page screenshot         |
| `geminiApiKey`   | string  | `process.env.GEMINI_API_KEY` | Gemini API key                                  |
| `systemPrompt`   | string  | Built-in prompt              | Custom system prompt for formatting             |

#### Returns

- **Promise<string>**: The LLM-formatted data

#### Throws

- **Error**: If Gemini API key is missing or invalid
- **Error**: If XLSX file cannot be read
- **Error**: If image generation fails

## Example

Run the included example:

```bash
# Clone this repository
git clone https://github.com/your-username/llm-xlsx-parser.git
cd llm-xlsx-parser

# Install dependencies
npm install

# Set up your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the example
npm run example
```

## Output Formats

The package provides data in three formats:

1. **📋 Structured Records**: Key-value pairs for each row (primary format)
2. **📊 CSV Data**: Traditional comma-separated values
3. **🖼️ Visual Image**: Screenshot of the spreadsheet for spatial context

This multi-format approach ensures LLMs can understand both the data content and its spatial relationships.

## Processing Steps

1. **📖 File Reading**: Reads the XLSX file and extracts data
2. **🔄 Format Conversion**: Converts data to CSV and structured records
3. **🖼️ Image Generation**: Creates a visual representation using Playwright
4. **📤 LLM Processing**: Sends all formats to Gemini for formatting
5. **📝 Output**: Returns LLM-optimized data format
6. **🧹 Cleanup**: Removes temporary files

## Why Use Multiple Formats?

- **Records**: Optimal for LLM processing and understanding
- **CSV**: Familiar format for data validation and backup
- **Image**: Helps LLMs understand complex layouts and spatial relationships

This combination addresses the limitations of traditional tabular data presentation to AI models.

## Requirements

- Node.js 18+ (ES modules support)
- Google Gemini API key
- Internet connection for processing

## Dependencies

- `@google/genai` - Google Gemini AI integration
- `xlsx` - Excel file parsing
- `canvas` - Image rendering
- `playwright` - Browser automation for screenshots
- `dotenv` - Environment variable management

## Error Handling

The module includes comprehensive error handling:

```javascript
try {
  const result = await parseXlsx("file.xlsx", "output.txt");
  console.log("Success:", result);
} catch (error) {
  if (error.message.includes("Gemini API key")) {
    console.error("API key issue:", error.message);
  } else if (error.message.includes("XLSX")) {
    console.error("File reading issue:", error.message);
  } else {
    console.error("General error:", error.message);
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the example code

---

**Note**: This module uses Google Gemini AI for processing and requires an API key. The package is designed to make spreadsheet data more accessible to LLMs by addressing their spatial processing limitations.
