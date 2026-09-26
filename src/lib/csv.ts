// Small, dependency-free RFC-4180-ish CSV helpers (comma delimiter). Handles
// quoted fields containing commas, quotes, or newlines. Good enough for the
// bounded, well-understood shape of our student import/export files — not a
// general-purpose CSV library.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normalize CRLF/CR to LF up front so newline handling below is simple,
  // except inside quoted fields where literal \r\n must be preserved verbatim.
  const len = text.length;
  let i = 0;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\r") {
      // Treat \r\n and lone \r as a single line break.
      if (text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush the trailing field/row, but skip a wholly-empty trailing row that
  // results from a trailing newline in the source text.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function toCsvRow(fields: (string | number)[]): string {
  return fields
    .map((raw) => {
      const value = String(raw);
      if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
    .join(",");
}
