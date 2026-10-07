import { mocksService } from '../services/mocks.service.js';

export const getMockUsers = (req, res, next) => {
    try {
        const users = mocksService.getMockUsers(req.query.qty);
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        next(error);
    }
};

export const getMockOrders = (req, res, next) => {
    try {
        const orders = mocksService.getMockOrders(req.query.qty);
        res.status(200).json({ status: 'success', payload: orders });
    } catch (error) {
        next(error);
    }
};

export const generateData = async (req, res, next) => {
    try {
        const { users, drivers, orders, deliveries } = req.body;
        const result = await mocksService.generateData({ users, drivers, orders, deliveries });
        res.status(201).json({ status: 'success', payload: result });
    } catch (error) {
        next(error);
    }
};