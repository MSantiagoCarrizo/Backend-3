import { mocksService } from '../services/mocks.service.js';

export const getMockUsers = (req, res) => {
    try {
        const quantity = Number(req.query.qty) || 10;
        const users = mocksService.getMockUsers(quantity);
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const getMockOrders = (req, res) => {
    try {
        const quantity = Number(req.query.qty) || 10;
        const orders = mocksService.getMockOrders(quantity);
        res.status(200).json({ status: 'success', payload: orders });
    } catch (error) {
        res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const generateData = async (req, res) => {
    try {
        const { users = 0, drivers = 0, orders = 0, deliveries = 0 } = req.body;
        const result = await mocksService.generateData({ users, drivers, orders, deliveries });
        res.status(201).json({ status: 'success', payload: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};