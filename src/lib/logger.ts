// Production Structured Logging Module

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  endpoint: string;
  action: string;
  latencyMs?: number;
  confidenceScores?: Record<string, number>;
  details?: any;
}

export function logClinicalEvent(entry: Omit<LogEntry, "timestamp">) {
  const fullLog: LogEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  if (process.env.NODE_ENV !== "test") {
    const formatted = `[${fullLog.level}] ${fullLog.endpoint} - ${fullLog.action} (${fullLog.latencyMs ? fullLog.latencyMs + "ms" : ""})`;
    if (fullLog.level === "ERROR") {
      console.error(formatted, fullLog.details || "");
    } else if (fullLog.level === "WARN") {
      console.warn(formatted, fullLog.details || "");
    } else {
      console.log(formatted);
    }
  }
}
