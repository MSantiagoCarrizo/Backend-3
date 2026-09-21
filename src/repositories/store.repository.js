import StoreModel from '../models/store.model.js';

export const storeRepository = {
  findById: async (id) => {
    return StoreModel.findById(id)
  },
};
