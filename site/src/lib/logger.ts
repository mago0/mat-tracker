import pino from "pino";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

export const logger = pino({
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    app: "mat-tracker",
    env: process.env.NODE_ENV || "development",
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Child loggers for specific contexts
export const authLogger = logger.child({ context: "auth" });
export const requestLogger = logger.child({ context: "request" });
export const actionLogger = logger.child({ context: "action" });
