import type ExcelJSType from "exceljs";

export interface ExportColumn {
  /** Property key on each row. */
  key: string;
  /** Display header shown in the styled header row. */
  header: string;
}

export interface ExportXlsxOptions {
  fileName: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  /** Brand color used for the header fill (hex, e.g. "#2563EB"). */
  brandColor: string;
}

/** Normalize a CSS hex color to the 8-char ARGB string ExcelJS expects. */
function toArgb(hex: string): string {
  let value = (hex || "").trim().replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (value.length !== 6) return "FF2563EB"; // safe fallback (brand blue)
  return `FF${value.toUpperCase()}`;
}

/** Convert a cell value into something Excel renders cleanly. */
function toCellValue(value: unknown): string | number | boolean | Date {
  if (value == null) return "";
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Export rows to a styled .xlsx file.
 *
 * Why ExcelJS: plain CSV cannot carry any styling, and SheetJS's community
 * build does not support cell styling (fills/fonts are a paid feature).
 * ExcelJS supports header fills, fonts, column widths and frozen panes in the
 * browser, so it is used here to satisfy the branded-header requirement.
 */
export async function exportRowsToXlsx({
  fileName,
  sheetName,
  columns,
  rows,
  brandColor,
}: ExportXlsxOptions): Promise<void> {
  // Lazy-load ExcelJS so its ~700kB only downloads when the user exports.
  const ExcelJS = (await import("exceljs")).default as typeof ExcelJSType;

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "Export", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
  });

  // Define columns (keys + headers); width is auto-sized below.
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: 16,
  }));

  // Data rows.
  for (const row of rows) {
    const record: Record<string, unknown> = {};
    for (const column of columns) record[column.key] = toCellValue(row[column.key]);
    sheet.addRow(record);
  }

  // Style the header row: brand fill, white bold text, centered.
  const headerArgb = toArgb(brandColor);
  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: headerArgb },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });

  // Auto-size each column to its content (header + cells), within bounds.
  sheet.columns.forEach((column) => {
    let maxLength = String(column.header ?? "").length;
    if (typeof column.eachCell === "function") {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const text = cell.value == null ? "" : String(cell.value);
        if (text.length > maxLength) maxLength = text.length;
      });
    }
    column.width = Math.min(60, Math.max(12, maxLength + 2));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
