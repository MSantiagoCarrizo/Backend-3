import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './index.js';


const levels = {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5,
};

const colors = {
    fatal: 'red bold',
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

const level = config.nodeEnv === 'production' ? 'info' : 'debug';

const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

const line = winston.format.printf(
    ({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`
);

const logger = winston.createLogger({
    levels,
    level,
    format: winston.format.combine(timestamp, line),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                timestamp,
                line
            ),
        }),
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
        }),
    ],
});

export default logger;