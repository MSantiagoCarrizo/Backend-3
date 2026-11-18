import fs from 'node:fs';
import { mock } from 'node:test';
import { expect } from 'chai';
import {
    api,
    assertError,
    createDriver,
    createOrder,
    createUser,
    NON_EXISTENT_ID,
    ORDER_KEYS,
    USER_KEYS,
} from './helpers.js';
import { clearDatabase } from './setup.js';
import logger from '../src/config/logger.js';
import { MAX_FILE_SIZE, UPLOAD_FOLDERS } from '../src/constants/index.js';

const PDF = {
    content: Buffer.from('%PDF-1.4 documento de prueba'),
    options: { filename: 'Constancia año.pdf', contentType: 'application/pdf' },
};
const PNG = {
    content: Buffer.from('imagen de prueba'),
    options: { filename: 'entrega.png', contentType: 'image/png' },
};
const TXT = {
    content: Buffer.from('texto de prueba'),
    options: { filename: 'notas.txt', contentType: 'text/plain' },
};
const TOO_BIG = {
    content: Buffer.alloc(MAX_FILE_SIZE + 1),
    options: { filename: 'grande.pdf', contentType: 'application/pdf' },
};

const FOLDERS = [UPLOAD_FOLDERS.DOCUMENTS, UPLOAD_FOLDERS.PROOFS];
const listFolders = () => FOLDERS.flatMap((folder) => fs.readdirSync(folder).map((name) => `${folder}/${name}`));

const expectMetadata = (document, { folder, ...expected }) => {
    expect(document).to.have.all.keys(['originalName', 'fileName', 'path', 'mimeType', 'size', 'type', 'uploadedAt']);
    expect(document).to.include(expected);
    expect(document.fileName).to.match(/^\d+-\d+\.[a-z]+$/);
    expect(document.path).to.equal(`${folder}/${document.fileName}`);
    expect(new Date(document.uploadedAt).toISOString()).to.equal(document.uploadedAt);
};

describe('Carga de archivos', () => {
    let previousFiles;
    const createdFiles = () => listFolders().filter((file) => !previousFiles.includes(file));

    beforeEach(async () => {
        await clearDatabase();
        previousFiles = listFolders();
    });

    afterEach(() => {
        createdFiles().forEach((file) => fs.rmSync(file));
    });

    describe('POST /api/users/:uid/documents', () => {
        const upload = (id) => api.post(`/api/users/${id}/documents`);

        it('responde 201 con el usuario y guarda la metadata del documento y el archivo en disco', async () => {
            const user = await createUser();

            const res = await upload(user._id).field('type', 'user_document').attach('document', PDF.content, PDF.options);

            expect(res.status).to.equal(201);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.have.all.keys(USER_KEYS);
            expect(res.body.payload).to.include({ _id: user._id, email: user.email });
            expect(res.body.payload).to.not.have.property('password');
            expect(res.body.payload.documents).to.have.lengthOf(1);
            const [document] = res.body.payload.documents;
            expectMetadata(document, {
                originalName: 'Constancia año.pdf',
                mimeType: 'application/pdf',
                size: PDF.content.length,
                type: 'user_document',
                folder: UPLOAD_FOLDERS.DOCUMENTS,
            });
            expect(document.fileName).to.match(/\.pdf$/);
            expect(createdFiles()).to.deep.equal([document.path]);
            expect(fs.readFileSync(document.path)).to.deep.equal(PDF.content);

            const stored = await api.get(`/api/users/${user._id}`);
            expect(stored.body.payload.documents).to.deep.equal([document]);
        });

        it('si no se envía type el documento queda como user_document, y se pueden cargar varios', async () => {
            const user = await createUser();

            await upload(user._id).attach('document', PDF.content, PDF.options);
            const res = await upload(user._id).attach('document', PNG.content, PNG.options);

            expect(res.status).to.equal(201);
            expect(res.body.payload.documents.map((document) => document.type)).to.deep.equal(['user_document', 'user_document']);
            expect(res.body.payload.documents.map((document) => document.mimeType)).to.deep.equal(['application/pdf', 'image/png']);
            expect(createdFiles()).to.have.lengthOf(2);
        });

        it('un repartidor puede cargar su licencia de conducir', async () => {
            const driver = await createDriver();

            const res = await upload(driver._id).field('type', 'driver_license').attach('document', PNG.content, PNG.options);

            expect(res.status).to.equal(201);
            expectMetadata(res.body.payload.documents[0], {
                mimeType: 'image/png',
                type: 'driver_license',
                folder: UPLOAD_FOLDERS.DOCUMENTS,
            });
        });

        it('responde 400 FILE_REQUIRED si no se envía ningún archivo', async () => {
            const user = await createUser();

            assertError(await upload(user._id).field('type', 'user_document'), 400, 'FILE_REQUIRED');
            assertError(await upload(user._id), 400, 'FILE_REQUIRED');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_FILE_TYPE si el tipo de archivo no está permitido', async () => {
            const user = await createUser();

            const res = await upload(user._id).attach('document', TXT.content, TXT.options);

            assertError(res, 400, 'INVALID_FILE_TYPE');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 413 FILE_TOO_LARGE si el archivo supera el máximo', async () => {
            const user = await createUser();

            const res = await upload(user._id).attach('document', TOO_BIG.content, TOO_BIG.options);

            assertError(res, 413, 'FILE_TOO_LARGE');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_FILE_FIELD si el archivo no viene en el campo document o el campo no tiene nombre', async () => {
            const user = await createUser();

            assertError(await upload(user._id).attach('file', PDF.content, PDF.options), 400, 'INVALID_FILE_FIELD');
            assertError(await upload(user._id).attach('', PDF.content, PDF.options), 400, 'INVALID_FILE_FIELD');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_DOCUMENT_TYPE si el tipo de documento no es válido', async () => {
            const user = await createUser();

            const res = await upload(user._id).field('type', 'delivery_proof').attach('document', PDF.content, PDF.options);

            assertError(res, 400, 'INVALID_DOCUMENT_TYPE');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_DRIVER_ROLE si la licencia de conducir es de un usuario que no es repartidor', async () => {
            const user = await createUser();

            const res = await upload(user._id).field('type', 'driver_license').attach('document', PDF.content, PDF.options);

            assertError(res, 400, 'INVALID_DRIVER_ROLE');
            expect(createdFiles()).to.deep.equal([]);
            const stored = await api.get(`/api/users/${user._id}`);
            expect(stored.body.payload.documents).to.deep.equal([]);
        });

        it('responde 404 USER_NOT_FOUND si el usuario no existe y no deja el archivo guardado', async () => {
            const res = await upload(NON_EXISTENT_ID).attach('document', PDF.content, PDF.options);

            assertError(res, 404, 'USER_NOT_FOUND');
            expect(createdFiles()).to.deep.equal([]);
        });
    });

    describe('POST /api/orders/:oid/proof', () => {
        const upload = (id) => api.post(`/api/orders/${id}/proof`);

        it('responde 200 con el pedido actualizado, con la metadata del comprobante y el archivo en disco', async () => {
            const { order, customer, store } = await createOrder();

            const res = await upload(order._id).attach('proof', PNG.content, PNG.options);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.have.all.keys(ORDER_KEYS);
            expect(res.body.payload).to.include({ _id: order._id, customer: customer._id, store: store._id, status: 'created' });
            const { proof } = res.body.payload;
            expectMetadata(proof, {
                originalName: 'entrega.png',
                mimeType: 'image/png',
                size: PNG.content.length,
                type: 'delivery_proof',
                folder: UPLOAD_FOLDERS.PROOFS,
            });
            expect(createdFiles()).to.deep.equal([proof.path]);

            const stored = await api.get(`/api/orders/${order._id}`);
            expect(stored.body.payload.proof).to.deep.equal(proof);
        });

        it('si el pedido ya tenía un comprobante lo reemplaza y elimina el archivo anterior', async () => {
            const { order } = await createOrder();
            const first = await upload(order._id).attach('proof', PNG.content, PNG.options);

            const res = await upload(order._id).attach('proof', PDF.content, PDF.options);

            expect(res.status).to.equal(200);
            expect(res.body.payload.proof.mimeType).to.equal('application/pdf');
            expect(res.body.payload.proof.fileName).to.not.equal(first.body.payload.proof.fileName);
            expect(createdFiles()).to.deep.equal([res.body.payload.proof.path]);
        });

        it('responde 400 FILE_REQUIRED si no se envía ningún archivo', async () => {
            const { order } = await createOrder();

            assertError(await upload(order._id), 400, 'FILE_REQUIRED');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_FILE_TYPE si el tipo de archivo no está permitido', async () => {
            const { order } = await createOrder();

            const res = await upload(order._id).attach('proof', TXT.content, TXT.options);

            assertError(res, 400, 'INVALID_FILE_TYPE');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 413 FILE_TOO_LARGE si el archivo supera el máximo', async () => {
            const { order } = await createOrder();

            const res = await upload(order._id).attach('proof', TOO_BIG.content, TOO_BIG.options);

            assertError(res, 413, 'FILE_TOO_LARGE');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 400 INVALID_FILE_FIELD si el archivo no viene en el campo proof', async () => {
            const { order } = await createOrder();

            const res = await upload(order._id).attach('document', PNG.content, PNG.options);

            assertError(res, 400, 'INVALID_FILE_FIELD');
            expect(createdFiles()).to.deep.equal([]);
        });

        it('responde 404 ORDER_NOT_FOUND si el pedido no existe y no deja el archivo guardado', async () => {
            const res = await upload(NON_EXISTENT_ID).attach('proof', PNG.content, PNG.options);

            assertError(res, 404, 'ORDER_NOT_FOUND');
            expect(createdFiles()).to.deep.equal([]);
        });
    });

    describe('Registro de eventos', () => {
        it('cargar un documento registra info con el archivo, el tipo y el usuario', async () => {
            const info = mock.method(logger, 'info', () => { });
            const user = await createUser();

            const res = await api.post(`/api/users/${user._id}/documents`).attach('document', PDF.content, PDF.options);

            const [document] = res.body.payload.documents;
            expect(info.mock.calls.map((call) => call.arguments[0])).to.include(
                `Documento cargado: ${document.fileName} (user_document) para el usuario ${user._id}`
            );
        });

        it('cargar un comprobante registra info con el pedido y el archivo', async () => {
            const info = mock.method(logger, 'info', () => { });
            const { order } = await createOrder();

            const res = await api.post(`/api/orders/${order._id}/proof`).attach('proof', PNG.content, PNG.options);

            expect(info.mock.calls.map((call) => call.arguments[0])).to.include(
                `Comprobante asociado al pedido ${order._id}: ${res.body.payload.proof.fileName}`
            );
        });

        it('un archivo rechazado por su tipo registra un warning con el tipo y el nombre', async () => {
            const warning = mock.method(logger, 'warning', () => { });
            const user = await createUser();

            await api.post(`/api/users/${user._id}/documents`).attach('document', TXT.content, TXT.options);

            expect(warning.mock.calls.map((call) => call.arguments[0])).to.include(
                'Archivo rechazado: tipo text/plain no permitido (notas.txt)'
            );
        });

        it('un error de carga se registra como warning con su código', async () => {
            const warning = mock.method(logger, 'warning', () => { });
            const { order } = await createOrder();

            await api.post(`/api/orders/${order._id}/proof`).attach('proof', TOO_BIG.content, TOO_BIG.options);

            expect(warning.mock.calls.map((call) => call.arguments[0])).to.include(
                `FILE_TOO_LARGE - El archivo supera el máximo de 5 MB - POST /api/orders/${order._id}/proof`
            );
        });
    });
});