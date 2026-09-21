import { storeRepository } from '../repositories/store.repository.js';

export const storeService = {
  getStores: async () => {
    return storeRepository.findAll();
  },

  getStoreById: async (id) => {
    const store = await storeRepository.findById(id);

    if (!store) {
      const error = new Error('Comercio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return store;
  },

  createStore: async (storeData) => {
    return storeRepository.create(storeData);
  },

  updateStore: async (id, storeData) => {
    const store = await storeRepository.update(id, storeData);

    if (!store) {
      const error = new Error('Comercio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return store;
  },

  deleteStore: async (id) => {
    const store = await storeRepository.delete(id);

    if (!store) {
      const error = new Error('Comercio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return store;
  },
};