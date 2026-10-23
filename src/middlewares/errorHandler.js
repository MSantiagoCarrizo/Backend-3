import { createError, errorResponse } from '../utils/apiResponse.js';
import { ERROR_CODES, ERROR_DICTIONARY } from '../utils/errorDictionary.js';

const isDomainError = (error) => typeof error.code === 'string' && error.code in ERROR_DICTIONARY;

const DUPLICATE_KEY_CODES = {
  email: ERROR_CODES.EMAIL_ALREADY_EXISTS,
};

const getDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyPattern || {})[0];
  return createError(DUPLICATE_KEY_CODES[field] || ERROR_CODES.DUPLICATE_KEY);
};

export const errorHandler = (error, req, res, next) => {
  let handledError = error;

  if (error.name === 'CastError') {
    handledError = createError(ERROR_CODES.INVALID_ID);
  } else if (error.name === 'ValidationError') {
    handledError = createError(ERROR_CODES.VALIDATION_ERROR);
  } else if (error.code === 11000) {
    handledError = getDuplicateKeyError(error);
  } else if (error.type === 'entity.parse.failed') {
    handledError = createError(ERROR_CODES.INVALID_JSON);
  } else if (!isDomainError(error)) {
    console.error(error);
    handledError = createError(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  return errorResponse(res, handledError);
};