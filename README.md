# XLSX to Image Converter for LLM Processing

A Node.js tool that converts Excel (XLSX) files to images, CSV, and JSON formats, then analyzes the data using Google's Gemini AI.

## Features

- Convert XLSX files to PNG images using HTML rendering
- Export data to CSV and JSON formats
- Automated analysis using Google Gemini AI
- Configurable image output (rows, columns, styling)

## Installation

```bash
# Install dependencies
npm install

# Or with pnpm
pnpm install
```

## Setup

1. Create a `.env` file in the root directory
2. Add your Google Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

## Usage

### Basic Usage

Place your Excel file in the `examples/` directory as `LOS.xlsx` and run:

```bash
npm start
```

This will:

- Convert the Excel file to CSV (`output/output.csv`)
- Convert to JSON format (`output/output.json`)
- Generate a PNG image (`output/spreadsheet.png`)
- Send all formats to Gemini AI for analysis (`output/output.txt`)

### Manual Image Creation

To create just the image:

```bash
npm run create-image
```

To generate HTML for manual screenshot:

```bash
npm run image
```

## Configuration

The image generation can be configured in `index.js`:

```javascript
const imagePath = await createImageFromXlsx(
  "examples/LOS.xlsx",
  "./output/spreadsheet.png",
  {
    maxRows: 50, // Maximum rows to include
    maxCols: 40, // Maximum columns to include
    fontSize: 8, // Font size in pixels
    cellPadding: 2, // Cell padding in pixels
    viewportWidth: 1920, // Browser viewport width
    viewportHeight: 1080, // Browser viewport height
    fullPage: true, // Take full page screenshot
  }
);
```

## Project Structure

```
llm-xlsx-parser/
├── index.js             # Main script - processes XLSX and sends to Gemini
├── create-image.js      # Automated XLSX to PNG conversion
├── xlsx-to-image.js     # HTML generation for image creation
├── system-prompt.txt    # System prompt for Gemini AI
├── examples/
│   └── LOS.xlsx        # Input Excel file
└── output/             # Generated files (CSV, JSON, PNG, analysis)
```

## Requirements

- Node.js (ES modules support)
- Google Gemini API key
- Excel file named `LOS.xlsx` in the `examples/` directory

## Dependencies

- `xlsx` - Excel file parsing
- `@google/genai` - Google Gemini AI integration
- `canvas` - Image rendering
- `dotenv` - Environment variable management

## License

ISC
