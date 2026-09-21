import UserModel from '../models/user.model.js';

export const userRepository = {
  findAll: async () => {
    return UserModel.find().select('-password');
  },

  findById: async (id) => {
    return UserModel.findById(id).select('-password');
  },

  create: async (userData) => {
    return UserModel.create(userData);
  },

  update: async (id, userData) => {
    return UserModel.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true,
    }).select('-password');
  },

  delete: async (id) => {
    return UserModel.findByIdAndDelete(id);
  },
};