import { deliveryService } from '../services/delivery.service.js';

export const getDeliveries = async (req, res) => {
  try {
    const deliveries = await deliveryService.getDeliveries();
    res.json({ status: 'success', payload: deliveries });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getDeliveryById = async (req, res) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.did);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const createDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    res.status(201).json({ status: 'success', payload: delivery });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const delivery = await deliveryService.updateDeliveryStatus(req.params.did, req.body.status);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const deleteDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.deleteDelivery(req.params.did);
    res.json({ status: 'success', payload: delivery });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};