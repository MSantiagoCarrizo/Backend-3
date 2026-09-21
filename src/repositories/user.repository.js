import UserModel from "../models/user.model.js";

export const userRepository = {
  findById: async(id) => {
    return UserModel.findById(id);
  }
}