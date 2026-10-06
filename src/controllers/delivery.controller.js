import { deliveryService } from '../services/delivery.service.js';

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveryService.getDeliveries();
    res.json({ status: 'success', payload: deliveries });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.did);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    next(error);
  }
};

export const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    res.status(201).json({ status: 'success', payload: delivery });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateDeliveryStatus(req.params.did, req.body.status);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    next(error);
  }
};

export const deleteDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.deleteDelivery(req.params.did);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    next(error);
  }
};