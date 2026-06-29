type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export function createLogger(context: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => log("info", context, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log("warn", context, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => log("error", context, message, meta),
  };
}
