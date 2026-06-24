import { Context, SessionFlavor } from "grammy";

// تعریف ساختار داده‌های موقت (Session)
export interface SessionData {
  step: 'idle' | 'list_type' | 'list_items' | 'table_headers' | 'table_rows' | 'table_style';
  listItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
  listType?: 'unordered' | 'ordered' | 'checkbox';
}

// ترکیب کانتکست اصلی تلگرام با سشن‌های ما
export type BotContext = Context & SessionFlavor<SessionData>;

// مقادیر اولیه برای شروع کار ربات
export function initialSession(): SessionData {
  return {
    step: 'idle',
    listItems: [],
    tableHeaders: [],
    tableRows: [],
    currentRow: 1,
  };
}

// تابع مهم برای جلوگیری از به هم ریختن تگ‌های HTML تلگرام
export function sanitizeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}