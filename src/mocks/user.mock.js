import { USER_ROLES } from '../constants/index.js';

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export const generateMockUser = (index) => ({
    firstName: `Cliente${index}`,
    lastName: `Prueba${index}`,
    email: `cliente${index}.${randomSuffix()}@test.com`,
    password: 'coder123',
    role: USER_ROLES.CUSTOMER,
});

export const generateMockUsers = (quantity) =>
    Array.from({ length: quantity }, (_, i) => generateMockUser(i + 1));

export const generateMockDriver = (index) => ({
    firstName: `Repartidor${index}`,
    lastName: `Prueba${index}`,
    email: `repartidor${index}.${randomSuffix()}@test.com`,
    password: 'coder123',
    role: USER_ROLES.DRIVER,
});

export const generateMockDrivers = (quantity) =>
    Array.from({ length: quantity }, (_, i) => generateMockDriver(i + 1));