import ExcelJS from "exceljs";
import fs from "fs";
import { read, utils } from "xlsx";

// Function to convert Excel cell style to CSS
function convertCellStyleToCSS(cellStyle, esCell) {
  const { style } = esCell;
  if (!style) return;
  if (!cellStyle) return "";

  const cssRules = [];

  // Handle fill/background patterns
  if (cellStyle.patternType === "solid" || cellStyle.fill) {
    // Handle direct properties (common in xlsx)
    if (cellStyle.fgColor && cellStyle.fgColor.rgb) {
      cssRules.push(`background-color: #${cellStyle.fgColor.rgb}`);
    } else if (cellStyle.bgColor && cellStyle.bgColor.rgb) {
      cssRules.push(`background-color: #${cellStyle.bgColor.rgb}`);
    }

    // Handle nested fill object (alternative structure)
    if (cellStyle.fill) {
      const fill = cellStyle.fill;
      if (fill.bgColor && fill.bgColor.rgb) {
        cssRules.push(`background-color: #${fill.bgColor.rgb}`);
      } else if (fill.fgColor && fill.fgColor.rgb) {
        cssRules.push(`background-color: #${fill.fgColor.rgb}`);
      }
    }
  }

  // Handle font styles
  if (style.font) {
    const font = style.font;
    if (font.bold) {
      cssRules.push("font-weight: bold");
    }
    if (font.italic) {
      cssRules.push("font-style: italic");
    }
    if (font.underline) {
      cssRules.push("text-decoration: underline");
    }
    if (font.strike) {
      cssRules.push("text-decoration: line-through");
    }
    if (font.color && font.color.rgb) {
      cssRules.push(`color: #${font.color.rgb}`);
    }
    if (font.color && font.color.theme === 1) {
      const cellValue = esCell?._value?.model?.result;
      if (typeof cellValue === "number" && cellValue < 0) {
        cssRules.push(`color: #ff0000`);
      }
    }
    if (font.size) {
      cssRules.push(`font-size: ${font.size}px`);
    }
    if (font.name) {
      cssRules.push(`font-family: ${font.name}`);
    }
  }

  // Handle borders
  if (style.border) {
    const border = style.border;
    const borderSides = ["top", "right", "bottom", "left"];

    borderSides.forEach((side) => {
      if (border[side]) {
        const borderStyle = border[side];
        let borderCSS = "";

        if (borderStyle.style) {
          // Convert Excel border styles to CSS
          const borderWidth =
            borderStyle.style === "thin"
              ? "1px"
              : borderStyle.style === "medium"
              ? "2px"
              : borderStyle.style === "thick"
              ? "3px"
              : "1px";
          borderCSS += borderWidth + " solid";
        }

        if (borderStyle.color && borderStyle.color.rgb) {
          borderCSS += ` #${borderStyle.color.rgb}`;
        } else {
          borderCSS += " #000000";
        }

        if (borderCSS) {
          cssRules.push(`border-${side}: ${borderCSS}`);
        }
      }
    });
  }

  // Handle alignment
  if (cellStyle.alignment) {
    const alignment = cellStyle.alignment;
    if (alignment.horizontal) {
      cssRules.push(`text-align: ${alignment.horizontal}`);
    }
    if (alignment.vertical) {
      const verticalMap = {
        top: "top",
        center: "middle",
        bottom: "bottom",
      };
      cssRules.push(
        `vertical-align: ${
          verticalMap[alignment.vertical] || alignment.vertical
        }`
      );
    }
    if (alignment.wrapText) {
      cssRules.push("white-space: normal");
    }
  }

  return cssRules.join("; ");
}

// Function to extract cell reference from HTML id (e.g., "sjs-A1" -> "A1")
function extractCellRef(id) {
  if (!id || !id.startsWith("sjs-")) return null;
  return id.substring(4); // Remove "sjs-" prefix
}

// Function to apply Excel cell styles to HTML table cells
function applyStylesToHTML(html, worksheet, esWorksheet) {
  let updatedHTML = html;
  let stylesApplied = 0;

  // Find all td elements with ids using regex
  const tdRegex = /<td([^>]*id="sjs-[A-Z]+\d+"[^>]*)>/g;
  let match;

  while ((match = tdRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const attributes = match[1];

    // Extract the cell id
    const idMatch = attributes.match(/id="(sjs-[A-Z]+\d+)"/);
    if (!idMatch) continue;

    const cellId = idMatch[1];
    const cellRef = extractCellRef(cellId);
    const esCell = esWorksheet.getCell(cellRef);

    // Skip if cell doesn't exist in worksheet or has no style
    if (!cellRef || !worksheet[cellRef] || !worksheet[cellRef].s) continue;

    // Convert Excel cell style to CSS
    const cssStyle = convertCellStyleToCSS(worksheet[cellRef].s, esCell);
    if (!cssStyle) continue;

    // Apply the style to the HTML element
    let newAttributes = attributes;
    const existingStyleMatch = attributes.match(/style="([^"]*)"/);

    if (existingStyleMatch) {
      // Append to existing style
      const existingStyle = existingStyleMatch[1];
      const combinedStyle =
        existingStyle + (existingStyle.endsWith(";") ? " " : "; ") + cssStyle;
      newAttributes = attributes.replace(
        /style="[^"]*"/,
        `style="${combinedStyle}"`
      );
    } else {
      // Add new style attribute
      newAttributes = attributes + ` style="${cssStyle}"`;
    }

    const newTdTag = `<td${newAttributes}>`;
    updatedHTML = updatedHTML.replace(fullMatch, newTdTag);
    stylesApplied++;
  }

  console.log(`Applied styles to ${stylesApplied} cells`);
  return updatedHTML;
}

// Main function to convert Excel file to styled HTML
async function convertExcelToStyledHTML(xlsxPath, outputPath) {
  try {
    // Read the Excel file with cell styles
    const workbook = read(fs.readFileSync(xlsxPath), { cellStyles: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const esWorkbook = new ExcelJS.Workbook();
    await esWorkbook.xlsx.readFile(xlsxPath);
    const esWorksheet = esWorkbook.getWorksheet(firstSheetName);

    // Generate HTML table from worksheet
    const html = utils.sheet_to_html(worksheet);

    // Apply Excel cell styles to HTML
    const styledHTML = applyStylesToHTML(html, worksheet, esWorksheet);

    // Add table styling for border collapse and spacing
    const finalHTML = styledHTML.replace(
      /<table/,
      '<table style="border-collapse: collapse; border-spacing: 0px; font-family: Calibri; font-size: 11px;"'
    );

    // Save the styled HTML
    if (outputPath) {
      fs.writeFileSync(outputPath, finalHTML);
      console.log(`Styled HTML saved to: ${outputPath}`);
    }

    return finalHTML;
  } catch (error) {
    console.error("Error converting Excel to styled HTML:", error);
    throw error;
  }
}

// Export the main function and helper functions
export { applyStylesToHTML, convertCellStyleToCSS, convertExcelToStyledHTML };
