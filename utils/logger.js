const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  info: (message, meta = {}) => {
    const logEntry = {
      timestamp: getCurrentTimestamp(),
      level: 'INFO',
      message,
      ...meta
    };
    writeToFile('app.log', logEntry);
    console.log(`[INFO] ${getCurrentTimestamp()}: ${message}`);
  },

  error: (message, meta = {}) => {
    const logEntry = {
      timestamp: getCurrentTimestamp(),
      level: 'ERROR',
      message,
      ...meta
    };
    writeToFile('error.log', logEntry);
    console.error(`[ERROR] ${getCurrentTimestamp()}: ${message}`);
  },

  warn: (message, meta = {}) => {
    const logEntry = {
      timestamp: getCurrentTimestamp(),
      level: 'WARN',
      message,
      ...meta
    };
    writeToFile('app.log', logEntry);
    console.warn(`[WARN] ${getCurrentTimestamp()}: ${message}`);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: getCurrentTimestamp(),
        level: 'DEBUG',
        message,
        ...meta
      };
      writeToFile('debug.log', logEntry);
      console.debug(`[DEBUG] ${getCurrentTimestamp()}: ${message}`);
    }
  }
};

const writeToFile = (filename, logEntry) => {
  const logPath = path.join(logsDir, filename);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logPath, logLine, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
};

module.exports = logger;