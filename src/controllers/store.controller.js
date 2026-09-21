import { storeService } from '../services/store.service.js';

export const getStores = async (req, res) => {
  try {
    const stores = await storeService.getStores();

    res.json({ status: 'success', payload: stores });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await storeService.getStoreById(req.params.sid);

    res.json({ status: 'success', payload: store });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const createStore = async (req, res) => {
  try {
    const store = await storeService.createStore(req.body);

    res.status(201).json({ status: 'success', payload: store });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const updateStore = async (req, res) => {
  try {
    const store = await storeService.updateStore(req.params.sid, req.body);

    res.json({ status: 'success', payload: store });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const store = await storeService.deleteStore(req.params.sid);

    res.json({ status: 'success', payload: store });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};