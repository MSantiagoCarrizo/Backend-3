import fs from 'node:fs/promises';
import logger from '../config/logger.js';

export const buildFileData = (file, type) => ({
    originalName: file.originalname,
    fileName: file.filename,
    path: `${file.destination}/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
    type,
    uploadedAt: new Date(),
});

export const removeFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        logger.warning(`No se pudo borrar el archivo ${filePath}: ${error.message}`);
    }
};