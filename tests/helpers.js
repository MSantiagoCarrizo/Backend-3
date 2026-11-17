import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { ERROR_DICTIONARY } from '../src/utils/errorDictionary.js';

export const api = request(app);

export const NON_EXISTENT_ID = '64b000000000000000000000';

export const assertError = (res, statusCode, code) => {
    expect(res.status).to.equal(statusCode);
    expect(res.body).to.deep.equal({
        status: 'error',
        message: ERROR_DICTIONARY[code].message,
        code,
    });
};

export const validUser = (userData = {}) => ({
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@test.com',
    password: 'coder123',
    ...userData,
});

export const createUser = async (userData = {}) => {
    const res = await api.post('/api/users').send(validUser(userData));

    expect(res.status).to.equal(201);
    return res.body.payload;
};

export const createStore = async () => {
    const owner = await createUser({ email: 'dueno@test.com', firstName: 'Dueño', role: 'store' });
    const res = await api
        .post('/api/stores')
        .send({ name: 'Pizzería Roma', address: 'Calle Falsa 123', owner: owner._id });

    expect(res.status).to.equal(201);
    return res.body.payload;
};

export const validOrder = (customerId, storeId, orderData = {}) => ({
    customer: customerId,
    store: storeId,
    items: [{ name: 'Paquete mediano', quantity: 2, price: 1500 }],
    deliveryAddress: 'Av. Siempre Viva 742',
    ...orderData,
});

export const createCustomerAndStore = async () => {
    const customer = await createUser();
    const store = await createStore();

    return { customer, store };
};

export const createOrder = async (orderData = {}) => {
    const { customer, store } = await createCustomerAndStore();
    const res = await api.post('/api/orders').send(validOrder(customer._id, store._id, orderData));

    expect(res.status).to.equal(201);
    return { customer, store, order: res.body.payload };
};

export const createDriver = async () => {
    return createUser({ email: 'repartidor@test.com', firstName: 'Maria', role: 'driver' });
};

export const validDelivery = (orderId, driverId, deliveryData = {}) => ({
    order: orderId,
    driver: driverId,
    ...deliveryData,
});

export const createOrderAndDriver = async () => {
    const { order } = await createOrder();
    const driver = await createDriver();

    return { order, driver };
};

export const createDelivery = async (deliveryData = {}) => {
    const { order, driver } = await createOrderAndDriver();
    const res = await api.post('/api/deliveries').send(validDelivery(order._id, driver._id, deliveryData));

    expect(res.status).to.equal(201);
    return { order, driver, delivery: res.body.payload };
};

export const USER_KEYS = ['_id', 'firstName', 'lastName', 'email', 'role', 'documents', 'createdAt', 'updatedAt'];
export const STORE_KEYS = ['_id', 'name', 'address', 'owner', 'isActive', 'createdAt', 'updatedAt'];
export const ORDER_KEYS = ['_id', 'customer', 'store', 'items', 'deliveryAddress', 'total', 'status', 'priority', 'proof', 'createdAt', 'updatedAt',];
export const DELIVERY_KEYS = ['_id', 'order', 'driver', 'status', 'priority', 'notes', 'createdAt', 'updatedAt'];

const expectIsoDate = (value) => {
    expect(new Date(value).toISOString()).to.equal(value);
};

export const expectUser = (user, expected = {}) => {
    expect(user).to.have.all.keys(USER_KEYS);
    expect(user._id).to.match(/^[a-f0-9]{24}$/);
    expect(user.documents).to.deep.equal([]);
    expectIsoDate(user.createdAt);
    expectIsoDate(user.updatedAt);
    expect(user).to.include(expected);
};

export const expectStore = (store, expected = {}) => {
    expect(store).to.have.all.keys(STORE_KEYS);
    expect(store._id).to.match(/^[a-f0-9]{24}$/);
    expectIsoDate(store.createdAt);
    expectIsoDate(store.updatedAt);
    expect(store).to.include(expected);
};

export const expectOrder = (order, expected = {}) => {
    expect(order).to.have.all.keys(ORDER_KEYS);
    expect(order._id).to.match(/^[a-f0-9]{24}$/);
    expect(order.items).to.be.an('array').that.is.not.empty;
    expect(order.proof).to.equal(null);
    expectIsoDate(order.createdAt);
    expectIsoDate(order.updatedAt);
    expect(order).to.include(expected);
};

export const expectDelivery = (delivery, expected = {}) => {
    expect(delivery).to.have.all.keys(DELIVERY_KEYS);
    expect(delivery._id).to.match(/^[a-f0-9]{24}$/);
    expectIsoDate(delivery.createdAt);
    expectIsoDate(delivery.updatedAt);
    expect(delivery).to.include(expected);
};