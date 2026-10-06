import { storeRepository } from '../repositories/store.repository.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const storeService = {
  getStores: async () => {
    return storeRepository.findAll();
  },

  getStoreById: async (id) => {
    const store = await storeRepository.findById(id);

    if (!store) {
      throw createError(ERROR_CODES.STORE_NOT_FOUND);
    }

    return store;
  },

  createStore: async (storeData) => {
    return storeRepository.create(storeData);
  },

  updateStore: async (id, storeData) => {
    const store = await storeRepository.update(id, storeData);

    if (!store) {
      throw createError(ERROR_CODES.STORE_NOT_FOUND);
    }

    return store;
  },

  deleteStore: async (id) => {
    const store = await storeRepository.delete(id);

    if (!store) {
      throw createError(ERROR_CODES.STORE_NOT_FOUND);
    }

    return store;
  },
};