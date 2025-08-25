import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      // Safe JSON stringification to avoid circular reference errors
      const safeStringify = (obj: any) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }
          return value;
        }, 2);
      };
      log += ` ${safeStringify(meta)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'elimuhub-server' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create a stream object for Morgan HTTP logging
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Helper methods for common logging scenarios
export const logRequest = (req: any, res: any, next: any) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });
  next();
};

export const logResponse = (req: any, res: any, next: any) => {
  const originalSend = res.send;
  res.send = function(data: any) {
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseSize: data ? data.length : 0,
      userId: req.user?.id || 'anonymous'
    });
    originalSend.call(this, data);
  };
  next();
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    context
  });
};

export const logSecurity = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logDatabase = (operation: string, details: any) => {
  logger.info('Database Operation', {
    operation,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logFileOperation = (operation: string, details: any) => {
  logger.info('File Operation', {
    operation,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logAI = (operation: string, details: any) => {
  logger.info('AI Operation', {
    operation,
    details,
    timestamp: new Date().toISOString()
  });
};

export default logger;