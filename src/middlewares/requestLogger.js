import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
    });

    next();
};