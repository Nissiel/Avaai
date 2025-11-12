type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    level,
    message,
    requestId: context.requestId,
    ...context,
    ts: new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  switch (level) {
    case "debug":
      console.debug(serialized);
      break;
    case "info":
      console.info(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    case "error":
    default:
      console.error(serialized);
      break;
  }
}

export const serverLogger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
