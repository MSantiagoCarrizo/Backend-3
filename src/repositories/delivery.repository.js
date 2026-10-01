import DeliveryModel from '../models/delivery.model.js';

export const deliveryRepository = {
  findAll: async () => {
    return DeliveryModel.find().populate('order').populate('driver', '-password');
  },

  findById: async (id) => {
    return DeliveryModel.findById(id).populate('order').populate('driver', '-password');
  },

  create: async (deliveryData) => {
    return DeliveryModel.create(deliveryData);
  },

  updateStatus: async (id, status) => {
    return DeliveryModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
  },

  delete: async (id) => {
    return DeliveryModel.findByIdAndDelete(id)
  }
};