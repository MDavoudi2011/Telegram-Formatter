export interface SessionData {
  step: 'idle' | 'list_type' | 'list_items' | 'table_headers' | 'table_rows' | 'table_style';
  listItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
  listType?: 'unordered' | 'ordered' | 'checkbox';
}

export function initialSession(): SessionData {
  return {
    step: 'idle',
    listItems: [],
    tableHeaders: [],
    tableRows: [],
    currentRow: 1,
  };
}

export function sanitizeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}