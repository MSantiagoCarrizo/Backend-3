import { mock } from 'node:test';
import { expect } from 'chai';
import { api } from './helpers.js';
import logger from '../src/config/logger.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { storeRepository } from '../src/repositories/store.repository.js';
import { orderRepository } from '../src/repositories/order.repository.js';
import { deliveryRepository } from '../src/repositories/delivery.repository.js';

const spyLogger = () => ({
  warning: mock.method(logger, 'warning', () => { }),
  error: mock.method(logger, 'error', () => { }),
});

describe('El errorHandler registra los errores', () => {
  it('un error esperado se registra como warning', async () => {
    const spy = spyLogger();

    await api.get('/api/nada');

    expect(spy.warning.mock.callCount()).to.equal(1);
    expect(spy.warning.mock.calls[0].arguments[0]).to.equal(
      'ROUTE_NOT_FOUND - Ruta no encontrada - GET /api/nada'
    );
    expect(spy.error.mock.callCount()).to.equal(0);
  });

  it('un error inesperado se registra como error, con el detalle original', async () => {
    const spy = spyLogger();
    mock.method(userRepository, 'findAll', async () => {
      throw new Error('detalle interno');
    });

    await api.get('/api/users');

    expect(spy.error.mock.callCount()).to.equal(1);
    const message = spy.error.mock.calls[0].arguments[0];
    expect(message).to.match(/^INTERNAL_SERVER_ERROR - Error interno del servidor - GET \/api\/users/);
    expect(message).to.include('detalle interno');
    expect(spy.warning.mock.callCount()).to.equal(0);
  });
});

describe('GET /loggerTest', () => {
  it('responde 200 y genera un log de cada nivel', async () => {
    const levels = ['debug', 'http', 'info', 'warning', 'error', 'fatal'];
    const spies = levels.map((level) => mock.method(logger, level, () => { }));

    const res = await api.get('/loggerTest');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'success', message: 'Logs generados correctamente' });
    spies.forEach((spy, i) => {
      const messages = spy.mock.calls.map((call) => call.arguments[0]);
      expect(messages).to.include(`Log de prueba: ${levels[i]}`);
    });
  });
});

describe('Eventos de negocio', () => {
  const ID = '64b000000000000000000000';

  it('crear un pedido registra info con su id', async () => {
    const info = mock.method(logger, 'info', () => { });
    mock.method(userRepository, 'findById', async () => ({ _id: ID }));
    mock.method(storeRepository, 'findById', async () => ({ _id: ID }));
    mock.method(orderRepository, 'create', async (data) => ({ _id: 'pedido1', ...data }));

    const res = await api.post('/api/orders').send({
      customer: ID,
      store: ID,
      items: [{ name: 'Pizza', price: 100, quantity: 2 }],
      deliveryAddress: 'Calle 123',
    });

    expect(res.status).to.equal(201);
    expect(info.mock.calls[0].arguments[0]).to.equal('Pedido creado: pedido1');
  });

  it('crear una entrega registra info con su id', async () => {
    const info = mock.method(logger, 'info', () => { });
    mock.method(orderRepository, 'findById', async () => ({ _id: ID }));
    mock.method(userRepository, 'findById', async () => ({ _id: ID, role: 'driver' }));
    mock.method(deliveryRepository, 'create', async (data) => ({ _id: 'entrega1', ...data }));

    const res = await api.post('/api/deliveries').send({ order: ID, driver: ID });

    expect(res.status).to.equal(201);
    expect(info.mock.calls[0].arguments[0]).to.equal('Entrega creada: entrega1');
  });

  it('generateData registra info con las cantidades creadas', async () => {
    const info = mock.method(logger, 'info', () => { });
    mock.method(userRepository, 'insertMany', async (users) => users.map((user, i) => ({ ...user, _id: i })));

    const res = await api.post('/api/mocks/generateData').send({ users: 2 });

    expect(res.status).to.equal(201);
    expect(info.mock.calls[0].arguments[0]).to.equal(
      'Datos de prueba generados: 2 usuarios, 0 repartidores, 0 pedidos, 0 entregas'
    );
  });

  it('si MongoDB falla al insertar, registra error con la causa', async () => {
    const error = mock.method(logger, 'error', () => { });
    mock.method(userRepository, 'insertMany', async () => {
      throw new Error('falla de MongoDB');
    });

    await api.post('/api/mocks/generateData').send({ users: 2 });

    const messages = error.mock.calls.map((call) => call.arguments[0]);
    expect(messages.some((message) => message.includes('falla de MongoDB'))).to.equal(true);
  });
});

describe('Registro de peticiones', () => {
  it('cada petición se registra con nivel http', async () => {
    const http = mock.method(logger, 'http', () => { });

    await api.get('/health');

    expect(http.mock.callCount()).to.equal(1);
    expect(http.mock.calls[0].arguments[0]).to.match(/^GET \/health 200 - \d+ms$/);
  });
});