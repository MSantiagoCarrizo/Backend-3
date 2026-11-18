import multer from 'multer';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, UPLOAD_FOLDERS } from '../constants/index.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES, ERROR_DICTIONARY } from '../utils/errorDictionary.js';
import logger from '../config/logger.js';

const MULTER_ERROR_CODES = {
    LIMIT_FILE_SIZE: ERROR_CODES.FILE_TOO_LARGE,
    LIMIT_UNEXPECTED_FILE: ERROR_CODES.INVALID_FILE_FIELD,
    MISSING_FIELD_NAME: ERROR_CODES.INVALID_FILE_FIELD,
};

const fileFilter = (req, file, cb) => {
    if (Object.hasOwn(ALLOWED_FILE_TYPES, file.mimetype)) {
        return cb(null, true);
    }

    logger.warning(`Archivo rechazado: tipo ${file.mimetype} no permitido (${file.originalname})`);
    cb(createError(ERROR_CODES.INVALID_FILE_TYPE));
};

const toProjectError = (error) => {
    if (error.code in ERROR_DICTIONARY) {
        return error;
    }

    return createError(MULTER_ERROR_CODES[error.code] || ERROR_CODES.UPLOAD_ERROR);
};

const createUpload = (folder, field) => {
    const upload = multer({
        storage: multer.diskStorage({
            destination: folder,
            filename: (req, file, cb) => {
                const extension = ALLOWED_FILE_TYPES[file.mimetype];
                cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
            },
        }),
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE },
        defParamCharset: 'utf8',
    }).single(field);

    return (req, res, next) => {
        upload(req, res, (error) => next(error ? toProjectError(error) : undefined));
    };
};

export const uploadDocument = createUpload(UPLOAD_FOLDERS.DOCUMENTS, 'document');
export const uploadProof = createUpload(UPLOAD_FOLDERS.PROOFS, 'proof');