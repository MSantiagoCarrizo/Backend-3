import { userRepository } from '../repositories/user.repository.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

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

  deleteUser: async (id) => {
    const user = await userRepository.delete(id);

    if (!user) {
      throw createError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  },
};