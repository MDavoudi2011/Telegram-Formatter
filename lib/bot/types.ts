import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  step: 'idle' | 'list_items' | 'table_headers' | 'table_rows';
  listItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
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
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
