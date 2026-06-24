"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Info, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type LogLevel = 'info' | 'error' | 'success' | 'warn';

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000);
    }
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warn': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'warn': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
              <Activity className="w-7 h-7 text-indigo-400" />
              System Logs
            </h1>
            <p className="text-neutral-400 text-sm">Real-time debugging and activity monitor</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${autoRefresh ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'}`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </button>
            <button 
              onClick={clearLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {loading && logs.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 bg-neutral-900/50">
              No logs recorded yet. Interact with the bot to see activity.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={log.id}
                    className={`p-4 rounded-xl border backdrop-blur-sm ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium truncate">{log.message}</span>
                          <span className="text-xs opacity-70 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                          </span>
                        </div>
                        {log.details && (
                          <div className="bg-black/40 p-3 rounded-lg overflow-x-auto border border-black/20">
                            <pre className="text-xs font-mono opacity-80 whitespace-pre-wrap break-all">
                              {log.details}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
