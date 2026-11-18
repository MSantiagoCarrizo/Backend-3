import { expect } from 'chai';
import { api } from './helpers.js';
import { swaggerSpecs } from '../src/docs/swagger.config.js';

const DOCUMENTED_RESPONSES = {
    'GET /api/users': ['200', '500'],
    'POST /api/users': ['201', '400', '409', '500'],
    'GET /api/users/{uid}': ['200', '400', '404', '500'],
    'PUT /api/users/{uid}': ['200', '400', '404', '409', '500'],
    'DELETE /api/users/{uid}': ['200', '400', '404', '500'],
    'POST /api/users/{uid}/documents': ['201', '400', '404', '413', '500'],
    'GET /api/orders': ['200', '500'],
    'POST /api/orders': ['201', '400', '404', '500'],
    'GET /api/orders/{oid}': ['200', '400', '404', '500'],
    'DELETE /api/orders/{oid}': ['200', '400', '404', '500'],
    'PUT /api/orders/{oid}/status': ['200', '400', '404', '500'],
    'POST /api/orders/{oid}/proof': ['200', '400', '404', '413', '500'],
    'GET /api/deliveries': ['200', '500'],
    'POST /api/deliveries': ['201', '400', '404', '500'],
    'GET /api/deliveries/{did}': ['200', '400', '404', '500'],
    'DELETE /api/deliveries/{did}': ['200', '400', '404', '500'],
    'PUT /api/deliveries/{did}/status': ['200', '400', '404', '500'],
    'GET /api/mocks/mockingusers': ['200', '400'],
    'GET /api/mocks/mockingorders': ['200', '400'],
    'POST /api/mocks/generateData': ['201', '400', '500'],
    'GET /loggerTest': ['200'],
};

describe('Swagger', () => {
    describe('GET /api/docs', () => {
        it('responde 200 con la página de Swagger UI', async () => {
            const res = await api.get('/api/docs/');

            expect(res.status).to.equal(200);
            expect(res.type).to.equal('text/html');
            expect(res.text).to.include('<title>Swagger UI</title>');
        });

        it('sin la barra final redirige a /api/docs/', async () => {
            const res = await api.get('/api/docs');

            expect(res.status).to.equal(301);
            expect(res.headers.location).to.equal('/api/docs/');
        });

        it('publica la documentación de ShipNow con todos los endpoints', async () => {
            const res = await api.get('/api/docs/swagger-ui-init.js');

            expect(res.status).to.equal(200);
            expect(res.text).to.include('ShipNow API');
            for (const path of Object.keys(DOCUMENTED_RESPONSES).map((endpoint) => endpoint.split(' ')[1])) {
                expect(res.text).to.include(`"${path}"`);
            }
        });
    });

    describe('Documentación', () => {
        it('los endpoints y las respuestas documentadas son los que cubre la suite', () => {
            const documented = {};
            for (const [path, operations] of Object.entries(swaggerSpecs.paths)) {
                for (const [method, operation] of Object.entries(operations)) {
                    documented[`${method.toUpperCase()} ${path}`] = Object.keys(operation.responses);
                }
            }

            expect(documented).to.deep.equal(DOCUMENTED_RESPONSES);
        });
    });
});