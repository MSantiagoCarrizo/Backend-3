import { userRepository } from '../repositories/user.repository.js';

export const userService = {
  getUsers: async () => {
    return userRepository.findAll();
  },

  getUserById: async (id) => {
    const user = await userRepository.findById(id);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return user;
  },

  createUser: async (userData) => {
    return userRepository.create(userData);
  },

  updateUser: async (id, userData) => {
    const user = await userRepository.update(id, userData);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return user;
  },

  deleteUser: async (id) => {
    const user = await userRepository.delete(id);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return user;
  },
};