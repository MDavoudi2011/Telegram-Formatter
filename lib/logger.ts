export type LogLevel = 'info' | 'error' | 'success' | 'warn';

export type LogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: any;
};

// In-memory log storage for debugging
const logs: LogEntry[] = [];

export const logger = {
  log: (level: LogLevel, message: string, details?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      level,
      message,
      // Serialize details to avoid circular references or large objects
      details: details ? (typeof details === 'object' ? JSON.stringify(details, Object.getOwnPropertyNames(details)) : String(details)) : undefined,
    };
    logs.unshift(entry); // Add to the beginning
    
    if (logs.length > 200) {
      logs.pop(); // Keep only the last 200 logs
    }
    
    // Also log to standard console
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}] ${message}`, details || '');
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, details || '');
    }
  },
  info: (msg: string, details?: any) => logger.log('info', msg, details),
  error: (msg: string, details?: any) => logger.log('error', msg, details),
  success: (msg: string, details?: any) => logger.log('success', msg, details),
  warn: (msg: string, details?: any) => logger.log('warn', msg, details),
  getLogs: () => logs,
  clear: () => { logs.length = 0; }
};
