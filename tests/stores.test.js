import { api, assertError, NON_EXISTENT_ID } from './helpers.js';
import { clearDatabase } from './setup.js';

describe('Stores', () => {
    beforeEach(clearDatabase);

    describe('GET /api/stores/:sid', () => {
        it('con un comercio que no existe responde STORE_NOT_FOUND', async () => {
            assertError(await api.get(`/api/stores/${NON_EXISTENT_ID}`), 404, 'STORE_NOT_FOUND');
        });
    });
});