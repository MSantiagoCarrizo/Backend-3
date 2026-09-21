import OrderModel from '../models/order.model.js';

export const orderRepository = {
  findAll: async () => {
    return OrderModel.find().populate('customer').populate('store');
  },

  findById: async (id) => {
    return OrderModel.findById(id).populate('customer').populate('store');
  },

  create: async (orderData) => {
    return OrderModel.create(orderData);
  },

  updateStatus: async (id, status) => {
    return OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
  },

  delete: async (id) => {
    return OrderModel.findByIdAndDelete(id)
  }
};
