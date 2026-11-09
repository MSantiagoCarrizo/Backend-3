import UserModel from '../models/user.model.js';

export const userRepository = {
  findAll: async () => {
    return UserModel.find().select('-password');
  },

  findById: async (id) => {
    return UserModel.findById(id).select('-password');
  },

  create: async (userData) => {
    const user = await UserModel.create(userData);
    user.password = undefined;
    return user;
  },

  insertMany: async (usersData) => {
    return UserModel.insertMany(usersData);
  },

  update: async (id, userData) => {
    return UserModel.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true,
    }).select('-password');
  },

  delete: async (id) => {
    return UserModel.findByIdAndDelete(id).select('-password');
  },
};