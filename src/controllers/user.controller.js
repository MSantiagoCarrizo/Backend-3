import { userService } from '../services/user.service.js';

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    res.json({ status: 'success', payload: users });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.uid);

    res.json({ status: 'success', payload: user });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({ status: 'success', payload: user });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.uid, req.body);

    res.json({ status: 'success', payload: user });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.uid);

    res.json({ status: 'success', payload: user });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: 'error', message: error.message });
  }
};