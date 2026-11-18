import { userRepository } from '../repositories/user.repository.js';
import { DOCUMENT_TYPES, USER_DOCUMENT_TYPES, USER_ROLES } from '../constants/index.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';
import { buildFileData, removeFile } from '../utils/files.js';
import logger from '../config/logger.js';

export const userService = {
  getUsers: async () => {
    return userRepository.findAll();
  },

  getUserById: async (id) => {
    const user = await userRepository.findById(id);

    if (!user) {
      throw createError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  },

  createUser: async (userData) => {
    return userRepository.create(userData);
  },

  updateUser: async (id, userData) => {
    const user = await userRepository.update(id, userData);

    if (!user) {
      throw createError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  },

  addDocument: async (id, file, type = DOCUMENT_TYPES.USER_DOCUMENT) => {
    if (!file) {
      throw createError(ERROR_CODES.FILE_REQUIRED);
    }

    try {
      if (!USER_DOCUMENT_TYPES.includes(type)) {
        throw createError(ERROR_CODES.INVALID_DOCUMENT_TYPE);
      }

      const user = await userRepository.findById(id);

      if (!user) {
        throw createError(ERROR_CODES.USER_NOT_FOUND);
      }

      if (type === DOCUMENT_TYPES.DRIVER_LICENSE && user.role !== USER_ROLES.DRIVER) {
        throw createError(ERROR_CODES.INVALID_DRIVER_ROLE);
      }

      const document = buildFileData(file, type);
      const updatedUser = await userRepository.addDocument(id, document);
      logger.info(`Documento cargado: ${document.fileName} (${type}) para el usuario ${id}`);

      return updatedUser;
    } catch (error) {
      await removeFile(file.path);
      throw error;
    }
  },

  deleteUser: async (id) => {
    const user = await userRepository.delete(id);

    if (!user) {
      throw createError(ERROR_CODES.USER_NOT_FOUND);
    }

    await Promise.all(user.documents.map((document) => removeFile(document.path)));

    return user;
  },
};