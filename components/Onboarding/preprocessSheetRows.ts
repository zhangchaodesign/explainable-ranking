/**
 * Preprocesses raw sheet rows from the new format:
 *
 *   index:UID    Breed Lifespan    Cuteness    Coolness
 *   cprop:type:info    info    criterion    criterion
 *   cprop:weight:1        1    1
 *   PAUN    15    0.4    0.9
 *
 * Into the standard format expected by processGoogleSheetData:
 *
 *   Row 0 (headers): [UID, Breed Lifespan, Cuteness, Coolness]
 *   Row 1 (types):   [info, info, criterion, criterion]
 *   Row 2+ (data):   data rows as-is
 *
 * Also extracts:
 *   - indexColumn: the column marked with `index:` prefix (used as unique ID)
 *   - defaultWeights: { columnName: weight } for criterion columns
 */

export interface PreprocessResult {
  /** Transformed rows in standard format: [headers, types, ...data] */
  rows: any[][];
  /** Column name marked as the unique identifier via `index:` prefix */
  indexColumn: string | null;
  /** Default weights for criterion columns from `cprop:weight:` row */
  defaultWeights: { [key: string]: number };
}

export function preprocessSheetRows(rawRows: any[][]): PreprocessResult {
  if (!rawRows || rawRows.length === 0) {
    return { rows: rawRows, indexColumn: null, defaultWeights: {} };
  }

  const headers = [...rawRows[0]];
  let indexColumn: string | null = null;

  // Detect `index:` prefix on the first column header
  const firstHeader = String(headers[0] || "");
  if (firstHeader.startsWith("index:")) {
    const colName = firstHeader.slice("index:".length);
    headers[0] = colName;
    indexColumn = colName;
  }

  // Separate cprop rows from data rows
  const cpropRows: { prop: string; defaultVal: string; cells: any[] }[] = [];
  const dataRows: any[][] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    const firstCell = String(row[0] || "");

    if (firstCell.startsWith("cprop:")) {
      // Parse cprop:PROP:DEFAULT
      const parts = firstCell.split(":");
      // parts[0] = "cprop", parts[1] = property name, parts[2] = default value
      const prop = parts[1] || "";
      const defaultVal = parts.slice(2).join(":"); // rejoin in case default contains ':'
      cpropRows.push({ prop, defaultVal, cells: row });
    } else {
      dataRows.push(row);
    }
  }

  // Build type row and weight mapping
  let typeRow: any[] | null = null;
  const defaultWeights: { [key: string]: number } = {};

  for (const cprop of cpropRows) {
    if (cprop.prop === "type") {
      // Build type row: first cell gets default, rest filled with default if empty
      typeRow = headers.map((_, colIndex) => {
        if (colIndex === 0) return cprop.defaultVal;
        const val = colIndex < cprop.cells.length ? cprop.cells[colIndex] : "";
        return val === "" || val === undefined || val === null
          ? cprop.defaultVal
          : val;
      });
    } else if (cprop.prop === "weight") {
      // Extract weight values; apply defaults only to criterion columns (resolved after type row)
      // Store raw weight row for later resolution
      const weightDefault = parseFloat(cprop.defaultVal) || 1;

      headers.forEach((header, colIndex) => {
        if (colIndex === 0) return; // skip index column
        const rawVal =
          colIndex < cprop.cells.length ? cprop.cells[colIndex] : "";
        const val =
          rawVal === "" || rawVal === undefined || rawVal === null
            ? null
            : parseFloat(String(rawVal));

        // We'll store all values; DataSelector will use only criterion weights
        if (val !== null && !isNaN(val)) {
          defaultWeights[header] = val;
        } else {
          // Mark for default application (will be resolved with type info)
          defaultWeights[header] = weightDefault;
        }
      });

      // If we have a type row, only keep weights for criterion columns
      // This is handled after the loop below
    }
  }

  // If type row exists, filter weights to only criterion columns
  if (typeRow) {
    const criterionColumns = new Set<string>();
    headers.forEach((header, colIndex) => {
      const type = String(typeRow![colIndex] || "").toLowerCase();
      const baseType = type.endsWith("!") ? type.slice(0, -1) : type;
      if (baseType === "criterion") {
        criterionColumns.add(header);
      }
    });

    // Remove non-criterion weights
    for (const key of Object.keys(defaultWeights)) {
      if (!criterionColumns.has(key)) {
        delete defaultWeights[key];
      }
    }
  }

  // Assemble output rows
  const resultRows: any[][] = [headers];
  if (typeRow) {
    resultRows.push(typeRow);
  }
  resultRows.push(...dataRows);

  return { rows: resultRows, indexColumn, defaultWeights };
}
