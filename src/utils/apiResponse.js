import { ERROR_CODES, ERROR_DICTIONARY } from './errorDictionary.js';

export const createError = (code) => {
  const activeCode = code in ERROR_DICTIONARY ? code : ERROR_CODES.INTERNAL_SERVER_ERROR;
  const { statusCode, message } = ERROR_DICTIONARY[activeCode];

  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = activeCode;
  return error;
};

export const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || ERROR_DICTIONARY[ERROR_CODES.INTERNAL_SERVER_ERROR].message;
  const code = error.code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({ status: 'error', message, code });
};