import { StorageAdapter } from "grammy";
import { SessionData } from "./types";

declare global {
  var __botSessions: Map<string, string> | undefined;
}
if (!globalThis.__botSessions) {
  globalThis.__botSessions = new Map<string, string>();
}

export class GlobalMapStorageAdapter implements StorageAdapter<SessionData> {
  read(key: string): SessionData | undefined {
    const val = globalThis.__botSessions!.get(key);
    return val ? JSON.parse(val) : undefined;
  }
  write(key: string, data: SessionData): void {
    globalThis.__botSessions!.set(key, JSON.stringify(data));
  }
  delete(key: string): void {
    globalThis.__botSessions!.delete(key);
  }
}
