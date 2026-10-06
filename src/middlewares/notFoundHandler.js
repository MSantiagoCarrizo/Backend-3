import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const notFoundHandler = (req, res, next) => {
  next(createError(ERROR_CODES.ROUTE_NOT_FOUND));
};