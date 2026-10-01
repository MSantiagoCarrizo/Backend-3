import mongoose from 'mongoose';
import { DELIVERY_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.ASSIGNED,
    },
    priority: {
      type: String,
      enum: Object.values(DELIVERY_PRIORITY),
      default: DELIVERY_PRIORITY.NORMAL,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

const DeliveryModel = mongoose.model('Delivery', deliverySchema);

export default DeliveryModel;