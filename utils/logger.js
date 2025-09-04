// Simple logger utility for the fitness tracker application

class Logger {
    constructor() {
        this.enabled = process.env.NODE_ENV !== 'test';
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                logMessage += ' ' + JSON.stringify(data, null, 2);
            } else {
                logMessage += ' ' + data;
            }
        }
        
        return logMessage;
    }

    info(message, data = null) {
        if (this.enabled) {
            console.log(this.formatMessage('info', message, data));
        }
    }

    warn(message, data = null) {
        if (this.enabled) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message, data = null) {
        if (this.enabled) {
            console.error(this.formatMessage('error', message, data));
        }
    }

    debug(message, data = null) {
        if (this.enabled && process.env.NODE_ENV === 'development') {
            console.log(this.formatMessage('debug', message, data));
        }
    }

    success(message, data = null) {
        if (this.enabled) {
            console.log(this.formatMessage('success', message, data));
        }
    }
}

// Export a singleton instance
module.exports = new Logger();
