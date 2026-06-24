import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  step: 'idle' | 'list_type' | 'list_items' | 'table_headers' | 'table_rows' | 'table_style';
  listItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
  listType?: 'unordered' | 'ordered' | 'checkbox';
}

export type BotContext = Context & SessionFlavor<SessionData>;

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

// تابع تشخیص خودکار وجود کلمات فارسی/عربی در متن
export function containsRTL(text: string): boolean {
  if (!text) return false;
  // این Regex بازه کاراکترهای حروف راست‌چین را بررسی می‌کند
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}