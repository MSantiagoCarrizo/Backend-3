import { USER_ROLES } from '../constants/index.js';

export const generateMockUser = (index) => ({
  firstName: `Cliente${index}`,
  lastName: `Prueba${index}`,
  email: `cliente${index}@test.com`,
  password: 'coder123',
  role: USER_ROLES.CUSTOMER,
});

export const generateMockUsers = (quantity) =>
  Array.from({ length: quantity }, (_, i) => generateMockUser(i + 1));

export const generateMockDriver = (index) => ({
  firstName: `Repartidor${index}`,
  lastName: `Prueba${index}`,
  email: `repartidor${index}@test.com`,
  password: 'coder123',
  role: USER_ROLES.DRIVER,
});

export const generateMockDrivers = (quantity) =>
  Array.from({ length: quantity }, (_, i) => generateMockDriver(i + 1));