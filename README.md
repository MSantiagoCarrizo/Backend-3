# ShipNow API

API REST para la gestión de logística y envíos. Permite administrar usuarios, comercios, pedidos y entregas, y está construida con Node.js, Express y MongoDB (Mongoose).

El proyecto está organizado en una arquitectura por capas (Controller → Service → Repository), valida su configuración de entorno al arrancar y maneja todos los errores en una capa común, con respuestas uniformes, y registra lo que ocurre con un logger centralizado (Winston). Los endpoints principales están documentados con Swagger (OpenAPI), con documentación interactiva en `/api/docs`. Cuenta con una suite de tests funcionales (Mocha, Chai y Supertest) que se ejecuta con `npm test`, como se explica en [Testing](#testing). También permite cargar archivos (documentos de usuario y comprobantes de pedido) con Multer, guardándolos en disco y dejando solo su metadata en la base, como se explica en [Carga de archivos](#carga-de-archivos).

## Tecnologías

* Node.js (ES Modules)
* Express 4
* MongoDB con Mongoose 8
* dotenv, para las variables de entorno
* cors, para habilitar peticiones desde otros orígenes (por ejemplo, un frontend en otro dominio o puerto)
* Winston y winston-daily-rotate-file, para el logging y la rotación de los archivos de log
* swagger-jsdoc y swagger-ui-express, para documentar la API con OpenAPI y mostrarla con Swagger UI
* Multer, para recibir archivos (`multipart/form-data`) y guardarlos en disco
* nodemon, en desarrollo
* Mocha, Chai y supertest, para los tests funcionales (ver [Testing](#testing))

## Instalación y ejecución

Requiere Node.js y una base de datos MongoDB.

1. Clonar el repositorio e ingresar a la carpeta:

```bash
git clone https://github.com/MSantiagoCarrizo/Backend-3.git
cd Backend-3
```

2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env` a partir de la plantilla `.env.example`:

```bash
cp .env.example .env
```

4. Completar el `.env` con los valores propios:

```txt
PORT=8080
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<nombre-de-la-base>?retryWrites=true&w=majority
NODE_ENV=development
```

5. Iniciar el servidor:

```bash
npm run dev
```

Con `npm start` se inicia sin nodemon.

6. Verificar que la API responde abriendo `http://localhost:8080/health`.

7. Abrir la documentación interactiva (Swagger) en `http://localhost:8080/api/docs`. Más detalles en [Documentación con Swagger](#documentación-con-swagger).

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que corre el servidor |
| `MONGODB_URI` | URI de conexión a MongoDB, incluyendo el nombre de la base de datos |
| `NODE_ENV` | Entorno de ejecución: `development` o `production` (los tests usan `test`). También define cuánto detalle se registra en los logs (ver [Logging](#logging)) |

Las tres variables son obligatorias y se validan una sola vez, al iniciar la aplicación, en `src/config/index.js`. Si falta alguna, la aplicación no arranca y muestra un error descriptivo:

```txt
Falta configurar la variable de entorno: MONGODB_URI
```

El archivo `.env` no se sube al repositorio. `.env.example` documenta las variables que necesita el proyecto, sin valores reales. El resto del código lee la configuración importando el objeto `config` y nunca accede a `process.env` directamente. Los tests no usan este `.env`: tienen el suyo, `.env.test` (ver [Testing](#testing)).

## Arquitectura

Cada petición recorre las capas en este orden, y cada capa solo conoce a la siguiente:

```txt
Request → Router → Controller → Service → Repository → Model → MongoDB
```

### Estructura de carpetas

```txt
.
├── .env.example
├── .env.test.example
├── .gitignore
├── .mocharc.json
├── README.md
├── package-lock.json
├── package.json
├── src/
│   ├── config/
│   │   ├── index.js              Carga y valida las variables de entorno
│   │   ├── db.js                 Conexión a MongoDB
│   │   └── logger.js             Logger central (Winston): niveles, formato y archivos
│   ├── constants/
│   │   └── index.js              Roles, estados, prioridades y límites del dominio
│   ├── controllers/
│   │   ├── delivery.controller.js
│   │   ├── logger.controller.js  Endpoint de prueba del logger
│   │   ├── mocks.controller.js
│   │   ├── order.controller.js
│   │   ├── store.controller.js
│   │   └── user.controller.js
│   ├── docs/
│   │   ├── swagger.config.js     Configuración de Swagger: info, servidor local y tags
│   │   ├── schemas.yaml          Schemas y respuestas reutilizables
│   │   ├── users.yaml
│   │   ├── orders.yaml
│   │   ├── deliveries.yaml
│   │   ├── mocks.yaml
│   │   └── logger.yaml
│   ├── middlewares/
│   │   ├── errorHandler.js       Middleware global: único lugar que responde los errores
│   │   ├── notFoundHandler.js    Convierte las rutas inexistentes en un error 404
│   │   ├── requestLogger.js      Registra cada petición HTTP (nivel http)
│   │   └── upload.middleware.js  Configuración central de Multer y errores de carga
│   ├── mocks/
│   │   ├── user.mock.js          Genera usuarios y repartidores de prueba
│   │   ├── order.mock.js         Genera pedidos de prueba
│   │   └── delivery.mock.js      Genera entregas de prueba
│   ├── models/
│   │   ├── delivery.model.js
│   │   ├── order.model.js
│   │   ├── store.model.js
│   │   └── user.model.js
│   ├── repositories/
│   │   ├── delivery.repository.js
│   │   ├── order.repository.js
│   │   ├── store.repository.js
│   │   └── user.repository.js
│   ├── routes/
│   │   ├── delivery.router.js
│   │   ├── logger.router.js      Ruta /loggerTest
│   │   ├── mocks.router.js
│   │   ├── orders.router.js
│   │   ├── stores.router.js
│   │   └── users.router.js
│   ├── services/
│   │   ├── delivery.service.js
│   │   ├── mocks.service.js
│   │   ├── order.service.js
│   │   ├── store.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   ├── errorDictionary.js    Códigos de error, con su status y su mensaje
│   │   ├── apiResponse.js        createError y errorResponse
│   │   └── files.js              Metadata de los archivos cargados y borrado de archivos
│   ├── app.js                    Configuración de Express y montaje de rutas
│   └── server.js                 Punto de entrada: conecta la base y levanta el servidor
└── tests/
    ├── setup.js                  Entorno de testing: carga .env.test, conecta a la base de testing y la limpia
    ├── helpers.js                Cliente HTTP (supertest), datos de prueba y verificaciones compartidas
    ├── users.test.js             Usuarios
    ├── orders.test.js            Pedidos y sus estados
    ├── deliveries.test.js        Entregas y sus estados
    ├── stores.test.js            Comercio inexistente
    ├── mocks.test.js             Mocks y generateData
    ├── swagger.test.js           Ruta de Swagger y coherencia con la documentación
    ├── logging.test.js           Logs de errores, eventos, peticiones y /loggerTest
    ├── errors.test.js            Ruta inexistente, error 11000 y error inesperado
    ├── uploads.test.js           Carga de archivos: documentos de usuario y comprobantes de pedido
    └── entorno.test.js           Conexión a la base de testing, /health y limpieza
```

### Responsabilidad de cada capa

| Capa | Qué hace | Qué no hace |
| --- | --- | --- |
| Router | Conecta cada path con un método del Controller | No tiene lógica |
| Controller | Recibe `req`, llama al Service y responde los casos exitosos con el código de estado adecuado. Si algo falla, deriva el error con `next(error)` | No importa Mongoose ni los Repositories, no calcula nada y no responde errores |
| Service | Aplica la lógica de negocio: validaciones, existencia de recursos, cálculo del total, estado inicial. Cuando algo está mal, lanza un error con `createError` | No conoce `req`, `res` ni Mongoose |
| Repository | Es el único lugar que accede a Mongoose: consultas, proyecciones y `populate` | No tiene reglas de negocio |
| Model | Define el esquema de cada colección | No contiene lógica de la aplicación |
| Middleware de errores | Es el único lugar que arma las respuestas de error, siempre con la misma estructura | No contiene reglas de negocio |

### Por qué separé Service y Repository

Separé la lógica en dos capas porque cada una tiene una razón distinta para cambiar.

El Service decide qué se puede hacer. Por ejemplo, en `createOrder` valida que lleguen los datos obligatorios, comprueba que el usuario y el comercio existan, calcula el total y define el estado inicial con `ORDER_STATUS.CREATED`. Ahí también vive la regla "si el recurso no existe, es un error 404", que se expresa lanzando `createError(ERROR_CODES.ORDER_NOT_FOUND)`. No sabe nada de Express ni de Mongoose.

El Repository solo sabe cómo se buscan y se guardan los datos. Por ejemplo, oculta el password con `select('-password')`, resuelve el `populate` en Orders y usa `{ new: true, runValidators: true }` al actualizar. No tiene reglas de negocio.

Con esta separación, si cambia una regla, como el cálculo del total, se toca solo el Service. Si cambia la forma de acceder a los datos, por ejemplo otra base o una capa de caché, se toca solo el Repository y ni el Service ni el Controller se enteran. Además, como el Service no depende de Express ni de Mongoose, su lógica se puede probar sin levantar un servidor ni una base de datos. Como el flujo siempre es el mismo (Controller llama a Service, y Service llama a Repository), también es más fácil entender por dónde pasa cada dato entre las capas.

## Constantes del dominio

Los valores fijos del negocio están centralizados en `src/constants/index.js` como objetos congelados con `Object.freeze` (más dos límites numéricos, `MOCK_MAX_QUANTITY` y `MAX_FILE_SIZE`). Los modelos y los services los usan en lugar de escribir strings sueltos.

| Constante | Valores |
| --- | --- |
| `USER_ROLES` | `admin`, `customer`, `store`, `driver` |
| `ORDER_STATUS` | `created`, `assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled` |
| `DELIVERY_PRIORITY` | `low`, `normal`, `high` |
| `DELIVERY_STATUS` | `assigned`, `in_transit`, `delivered`, `cancelled` |
| `MOCK_MAX_QUANTITY` | `1000`: cantidad máxima de cada tipo de dato que pueden generar los mocks |
| `DOCUMENT_TYPES` | `user_document`, `driver_license`, `delivery_proof` |
| `USER_DOCUMENT_TYPES` | `user_document`, `driver_license`: los tipos que se pueden cargar en un usuario |
| `UPLOAD_FOLDERS` | `uploads/documents` (documentos de usuario) y `uploads/proofs` (comprobantes de pedido) |
| `ALLOWED_FILE_TYPES` | Tipos de archivo permitidos, con la extensión con la que se guardan: `application/pdf` (`.pdf`), `image/jpeg` (`.jpg`), `image/png` (`.png`) y `image/webp` (`.webp`) |
| `MAX_FILE_SIZE` | `5 * 1024 * 1024`: tamaño máximo de un archivo, en bytes (5 MB) |

## Modelo de datos

### User

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `firstName`, `lastName` | String | Obligatorios |
| `email` | String | Obligatorio y único |
| `password` | String | Obligatorio |
| `role` | String | Uno de `USER_ROLES`, por defecto `customer` |
| `documents` | Array | Metadata de los documentos cargados. Por defecto vacío |

### Store

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `name`, `address` | String | Obligatorios |
| `owner` | ObjectId | Referencia a un User, obligatorio |
| `isActive` | Boolean | Por defecto `true` |

### Order

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `customer` | ObjectId | Referencia a un User, obligatorio |
| `store` | ObjectId | Referencia a un Store, obligatorio |
| `items` | Array | Cada ítem tiene `name`, `quantity` y `price` |
| `deliveryAddress` | String | Obligatorio |
| `total` | Number | Calculado por el Service |
| `status` | String | Uno de `ORDER_STATUS`, por defecto `created` |
| `priority` | String | Uno de `DELIVERY_PRIORITY`, por defecto `normal` |
| `proof` | Object | Metadata del comprobante de entrega. Por defecto `null` |

### Delivery

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `order` | ObjectId | Referencia a un Order, obligatorio |
| `driver` | ObjectId | Referencia a un User con rol `driver`, obligatorio |
| `status` | String | Uno de `DELIVERY_STATUS`, por defecto `assigned` |
| `priority` | String | Uno de `DELIVERY_PRIORITY`, por defecto `normal` |
| `notes` | String | Opcional |

Todos los modelos incluyen `createdAt` y `updatedAt`.

## Endpoints

La URL base en local es `http://localhost:8080`. Los endpoints se pueden probar con Thunder Client, Postman o herramientas similares. Los principales también están documentados en Swagger, desde donde se pueden probar (ver [Documentación con Swagger](#documentación-con-swagger)). Los dos que cargan archivos (`POST /api/users/:uid/documents` y `POST /api/orders/:oid/proof`) usan `multipart/form-data` y se explican en [Carga de archivos](#carga-de-archivos).

### General

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Verifica que la API está funcionando |
| GET | `/loggerTest` | Genera un log de cada nivel para probar el logger (está en la raíz, fuera de `/api`; ver [Logging](#logging)) |
| GET | `/api/docs` | Documentación interactiva de la API con Swagger (ver [Documentación con Swagger](#documentación-con-swagger)) |

### Users

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/users` | Lista los usuarios |
| GET | `/api/users/:uid` | Obtiene un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:uid` | Actualiza un usuario |
| DELETE | `/api/users/:uid` | Elimina un usuario |
| POST | `/api/users/:uid/documents` | Carga un documento del usuario |

Ninguna respuesta de usuarios incluye el campo `password`.

Ejemplo de body para crear un usuario:

```json
{
  "firstName": "Ana",
  "lastName": "Gómez",
  "email": "ana@test.com",
  "password": "123456"
}
```

### Stores

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/stores` | Lista los comercios |
| GET | `/api/stores/:sid` | Obtiene un comercio |
| POST | `/api/stores` | Crea un comercio |
| PUT | `/api/stores/:sid` | Actualiza un comercio |
| DELETE | `/api/stores/:sid` | Elimina un comercio |

Ejemplo de body para crear un comercio:

```json
{
  "name": "Kiosco Centro",
  "address": "Av. Siempre Viva 742",
  "owner": "ID_DEL_USUARIO"
}
```

### Orders

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/orders` | Lista los pedidos, con el cliente (sin password) y el comercio |
| GET | `/api/orders/:oid` | Obtiene un pedido |
| POST | `/api/orders` | Crea un pedido |
| PUT | `/api/orders/:oid/status` | Actualiza el estado de un pedido |
| DELETE | `/api/orders/:oid` | Elimina un pedido |
| POST | `/api/orders/:oid/proof` | Carga el comprobante de entrega del pedido |

Al crear un pedido, el Service:

* exige `customer`, `store`, `items` y `deliveryAddress`, y que `items` tenga al menos un producto;
* comprueba que el usuario y el comercio existan;
* calcula el `total` sumando `price × quantity` de cada ítem;
* asigna el estado inicial `created` y la prioridad `normal` si no se envía otra.

Ejemplo de body para crear un pedido (la prioridad es opcional):

```json
{
  "customer": "ID_DEL_USUARIO",
  "store": "ID_DEL_COMERCIO",
  "deliveryAddress": "Calle 456",
  "priority": "high",
  "items": [
    { "name": "Caja mediana", "quantity": 2, "price": 1500 },
    { "name": "Sobre chico", "quantity": 1, "price": 800 }
  ]
}
```

Ejemplo de body para actualizar el estado:

```json
{
  "status": "in_transit"
}
```

Al actualizar el estado, el Service comprueba que sea uno de `ORDER_STATUS`; si no, responde con el error `INVALID_ORDER_STATUS`.

### Deliveries

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/deliveries` | Lista las entregas, con el pedido y el repartidor (sin password) |
| GET | `/api/deliveries/:did` | Obtiene una entrega |
| POST | `/api/deliveries` | Crea una entrega |
| PUT | `/api/deliveries/:did/status` | Actualiza el estado de una entrega |
| DELETE | `/api/deliveries/:did` | Elimina una entrega |

Al crear una entrega, el Service:

* exige `order` y `driver`;
* comprueba que el pedido exista;
* comprueba que el usuario indicado como `driver` exista y tenga `role: "driver"`;
* asigna el estado inicial `assigned` y la prioridad `normal` si no se envía otra.

Ejemplo de body para crear una entrega (`notes` es opcional):

```json
{
  "order": "ID_DEL_PEDIDO",
  "driver": "ID_DEL_REPARTIDOR",
  "notes": "Entregar en portería"
}
```

Al actualizar el estado de una entrega, el Service comprueba que sea uno de `DELIVERY_STATUS`; si no, responde con el error `INVALID_DELIVERY_STATUS`. Por ejemplo, `picked_up` es válido para un pedido, pero no para una entrega.

### Mocking

Endpoints para generar datos de prueba durante el desarrollo, sin afectar el flujo normal de la API. Están pensados para completar la base rápido al testear, no para usarse desde una aplicación real.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/mocks/mockingusers?qty=N` | Genera usuarios falsos de ejemplo, sin guardarlos en la base |
| GET | `/api/mocks/mockingorders?qty=N` | Genera pedidos falsos de ejemplo, sin guardarlos en la base |
| POST | `/api/mocks/generateData` | Genera e inserta datos de prueba reales en la base |

`qty` es opcional en los dos `GET`; si no se envía, se usa 10 por defecto. Si se envía, tiene que ser un entero entre 1 y 1000. En caso contrario la API responde con un error (ver [Manejo de errores](#manejo-de-errores)).

`POST /api/mocks/generateData` recibe en el body cuántos registros generar de cada tipo:

```json
{
  "users": 5,
  "drivers": 2,
  "orders": 5,
  "deliveries": 5
}
```

Cada campo es opcional y por defecto es `0`. Si se envía, tiene que ser un entero entre 0 y 1000, y al menos uno tiene que ser mayor que 0. El orden importa: para generar `orders` hace falta pedir `users` en la misma solicitud (los pedidos quedan asociados a esos usuarios recién creados), y además tiene que existir al menos un `Store` ya cargado en la base (los comercios no se generan automáticamente). Para generar `deliveries` hace falta pedir `orders` y `drivers` en la misma solicitud. Si falta alguno de estos requisitos, la API responde con un error 400 que indica qué falta. Las cantidades se validan todas antes de insertar, así que una cantidad inválida no deja datos a medio crear. Si MongoDB falla durante la carga, la API responde con un error 500 controlado (`MOCK_GENERATION_ERROR`).

Respuesta esperada:

```json
{
  "status": "success",
  "payload": {
    "users": 5,
    "drivers": 2,
    "orders": 5,
    "deliveries": 5
  }
}
```

## Carga de archivos

La API recibe archivos con [Multer](https://github.com/expressjs/multer), un middleware que lee las peticiones `multipart/form-data`. Los archivos se guardan en disco, dentro de `uploads/`, y en MongoDB queda **solo la metadata** (nombre original, nombre generado, ruta, tipo, tamaño, tipo de documento y fecha). El contenido del archivo nunca se guarda en la base.

### Endpoints

| Método | Ruta | Campos del form-data | Qué hace |
| --- | --- | --- | --- |
| POST | `/api/users/:uid/documents` | `document` (archivo, obligatorio) y `type` (texto, opcional) | Guarda un documento del usuario y agrega su metadata a `documents` |
| POST | `/api/orders/:oid/proof` | `proof` (archivo, obligatorio) | Guarda el comprobante de entrega del pedido y deja su metadata en `proof` |

`POST /api/users/:uid/documents` responde `201` con el usuario (sin `password`) y todos sus documentos. `POST /api/orders/:oid/proof` responde `200` con el pedido actualizado, sin cambiarle el estado. Si el pedido ya tenía un comprobante, el nuevo lo reemplaza y el archivo anterior se elimina del disco.

### Reglas de los archivos

* **Formatos permitidos:** PDF, JPG, PNG y WEBP (`ALLOWED_FILE_TYPES`). Se validan por el tipo que declara el cliente, no por el contenido del archivo.
* **Tamaño máximo:** 5 MB (`MAX_FILE_SIZE`).
* **Nombre guardado:** lo genera el servidor, con la forma `<fecha en milisegundos>-<número al azar><extensión>`, por ejemplo `1763478092345-482910356.pdf`. La extensión sale del tipo permitido. Así no se pisan archivos ni se usa en el disco un nombre que eligió el cliente. El nombre original queda en la metadata.
* **Tipos de documento:** el campo `type` de `POST /api/users/:uid/documents` acepta estos valores:

| Tipo | Detalle |
| --- | --- |
| `user_document` | Documento general. Es el valor por defecto si no se envía `type` |
| `driver_license` | Licencia de conducir. Solo la puede cargar un usuario con `role: "driver"` |
| `delivery_proof` | Lo asigna el servidor a los comprobantes de pedido. No se puede enviar como `type` de un documento de usuario |

### Metadata guardada

Cada documento de `User.documents` y el `Order.proof` tienen estos campos:

| Campo | Detalle | Ejemplo |
| --- | --- | --- |
| `originalName` | Nombre original del archivo | `dni-frente.pdf` |
| `fileName` | Nombre generado por el servidor | `1763478092345-482910356.pdf` |
| `path` | Ubicación en el servidor, siempre con `/` (también en Windows) | `uploads/documents/1763478092345-482910356.pdf` |
| `mimeType` | Tipo del archivo | `application/pdf` |
| `size` | Tamaño en bytes | `184320` |
| `type` | Tipo de documento | `user_document` |
| `uploadedAt` | Fecha de la carga | `2026-11-18T15:04:21.000Z` |

### Carpetas y Git

Cada tipo de archivo se guarda en su carpeta:

```txt
uploads/
├── documents/   Documentos de usuario
└── proofs/      Comprobantes de pedido
```

Multer crea las carpetas al arrancar la aplicación, así que no hace falta crearlas a mano. `uploads` está en el `.gitignore`: los archivos cargados no se suben al repositorio.

### Cómo está armado

* `src/middlewares/upload.middleware.js` concentra la configuración de Multer: dónde se guardan los archivos, cómo se nombran, qué tipos se aceptan y el tamaño máximo. Exporta un middleware por endpoint (`uploadDocument` y `uploadProof`) y los routers solo lo ponen antes del controller, sin configuración propia:

```js
router.post("/:uid/documents", uploadDocument, uploadUserDocument);
```

* Ese mismo middleware traduce los errores de Multer a códigos del proyecto (`FILE_TOO_LARGE`, `INVALID_FILE_FIELD`, `UPLOAD_ERROR`). Los errores de carga salen por el `errorHandler`, con la misma estructura que el resto de la API (ver [Manejo de errores](#manejo-de-errores)).
* `src/utils/files.js` arma la metadata (`buildFileData`) y borra archivos (`removeFile`).
* El Service valida lo que depende de los datos (que el archivo exista, el tipo de documento, que el usuario o el pedido existan y la regla de la licencia) y guarda la metadata. El Repository es el único que usa Mongoose: `addDocument` agrega el documento al usuario y `updateProof` guarda el comprobante del pedido.

### Archivos sueltos

Multer guarda el archivo antes de que el Service valide el resto. Si algo falla después (por ejemplo, el usuario no existe o el `type` no es válido), el Service borra el archivo recién guardado y lanza el error, así que los errores no dejan archivos sueltos en `uploads/`. Los errores del propio Multer (tipo no permitido, archivo demasiado grande) no llegan a dejar nada en el disco.

Al eliminar un usuario, se borran también sus documentos de `uploads/documents`, y al eliminar un pedido, su comprobante de `uploads/proofs`. Si el archivo ya no está en el disco, la eliminación igual se completa y se registra un `warning`.

### Cómo probar la carga

Con Thunder Client o una herramienta similar:

1. Crear un usuario (o un pedido) y copiar su `_id`.
2. Hacer `POST http://localhost:8080/api/users/<id>/documents`, o `POST http://localhost:8080/api/orders/<id>/proof`.
3. En **Body** elegir **Form**. En **Files** escribir el nombre del campo (`document` o `proof`) y elegir el archivo. El `type`, si se envía, va en **Form Fields**. No hay que agregar el header `Content-Type`: la herramienta lo arma sola.
4. La respuesta es `201` o `200`, con la metadata, y el archivo aparece en `uploads/documents` o `uploads/proofs` con su nombre generado.

Los casos de error están en la tabla de [Cómo probar los casos inválidos](#cómo-probar-los-casos-inválidos). Desde Swagger, cada endpoint de carga muestra un selector de archivo (ver [Cómo probar los endpoints desde Swagger](#cómo-probar-los-endpoints-desde-swagger)).

## Manejo de errores

Todos los errores de la API se resuelven en una capa común. Ningún Router, Controller ni Service arma una respuesta de error a mano: cada capa hace una sola cosa y el cliente siempre recibe la misma estructura.

### Estructura de la respuesta

Las respuestas exitosas tienen esta forma:

```json
{
  "status": "success",
  "payload": {}
}
```

Todas las respuestas de error tienen esta otra:

```json
{
  "status": "error",
  "message": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}
```

| Campo | Qué contiene |
| --- | --- |
| `status` | Siempre `"error"` |
| `message` | Un texto corto y legible |
| `code` | Un identificador estable del error, para que quien consume la API pueda reaccionar sin depender del texto |

El código HTTP de la respuesta (400, 404, 409, 413 o 500) también sale del diccionario de errores, junto con el mensaje.

### Cómo funciona

```txt
Service lanza el error → Controller lo deriva con next(error) → errorHandler arma la respuesta
```

* **Diccionario de errores** (`src/utils/errorDictionary.js`): define los códigos (`ERROR_CODES`) y asocia a cada uno su `statusCode` y su `message` (`ERROR_DICTIONARY`). Es el único lugar donde se escribe un mensaje de error.
* **Errores de dominio** (`createError`, en `src/utils/apiResponse.js`): crea un error a partir de un código, por ejemplo `throw createError(ERROR_CODES.USER_NOT_FOUND)`. Los Services los lanzan apenas detectan el problema.
* **Controllers**: en el `catch` solo hacen `next(error)`. No responden errores.
* **Middleware global** (`src/middlewares/errorHandler.js`): es el único lugar que responde errores, a través de `errorResponse`. Se registra al final de `app.js`, después de todas las rutas y del `notFoundHandler` (`src/middlewares/notFoundHandler.js`), que convierte las rutas inexistentes en un `ROUTE_NOT_FOUND`.

El `errorHandler` también traduce los errores que no son nuestros, para que respondan con la misma estructura:

| Error original | Se convierte en |
| --- | --- |
| ID de Mongo con formato incorrecto (`CastError`) | `INVALID_ID` |
| Mongoose rechaza un dato (`ValidationError`) | `VALIDATION_ERROR` |
| Valor repetido en un campo único (error `11000` de Mongo) | `EMAIL_ALREADY_EXISTS` si el campo repetido es `email`, `DUPLICATE_KEY` si es cualquier otro |
| JSON mal formado en el body | `INVALID_JSON` |
| Cualquier error inesperado | `INTERNAL_SERVER_ERROR` |

Los errores inesperados se registran completos en el log (ver [Logging](#logging)), pero al cliente solo le llega el mensaje genérico, para no exponer detalles internos.

Para saber qué campo se repitió, el `errorHandler` lee `error.keyPattern` y lo busca en `DUPLICATE_KEY_CODES`. Hoy el único campo `unique` es `email`; si se agrega otro, se suma a ese objeto con su propio código.

### Códigos de error

| Código | Status | Mensaje | Cuándo ocurre |
| --- | --- | --- | --- |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor | Error inesperado: un bug, la base caída, etc. |
| `ROUTE_NOT_FOUND` | 404 | Ruta no encontrada | La ruta pedida no existe |
| `VALIDATION_ERROR` | 400 | Datos inválidos o faltantes | Faltan campos obligatorios, o Mongoose rechaza un dato (por ejemplo un `role` o una `priority` inexistente) |
| `INVALID_ID` | 400 | ID inválido | Un ID tiene un formato incorrecto |
| `INVALID_JSON` | 400 | JSON inválido | El body no es un JSON válido |
| `EMAIL_ALREADY_EXISTS` | 409 | El email ya está registrado | Se crea o actualiza un usuario con un email ya registrado |
| `DUPLICATE_KEY` | 409 | El registro ya existe | Se repite el valor de un campo único que no es el email |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado | El usuario no existe |
| `STORE_NOT_FOUND` | 404 | Comercio no encontrado | El comercio no existe |
| `ORDER_NOT_FOUND` | 404 | Pedido no encontrado | El pedido no existe |
| `DELIVERY_NOT_FOUND` | 404 | Entrega no encontrada | La entrega no existe |
| `DRIVER_NOT_FOUND` | 404 | Repartidor no encontrado | El repartidor indicado en una entrega no existe |
| `ORDER_ITEMS_REQUIRED` | 400 | El pedido necesita productos | Un pedido se crea sin productos |
| `INVALID_ORDER_STATUS` | 400 | Estado de pedido inválido | El estado enviado no es uno de `ORDER_STATUS` |
| `INVALID_DELIVERY_STATUS` | 400 | Estado de entrega inválido | El estado enviado no es uno de `DELIVERY_STATUS` |
| `INVALID_DRIVER_ROLE` | 400 | El usuario no es repartidor | El usuario indicado como repartidor, o que carga una `driver_license`, no tiene `role: "driver"` |
| `INVALID_MOCK_AMOUNT` | 400 | Cantidad inválida | Una cantidad de los mocks no es un entero válido (texto, negativa, decimal o todas en 0) |
| `MOCK_AMOUNT_TOO_LARGE` | 400 | Cantidad máxima: 1000 | Una cantidad de los mocks supera el máximo de 1000 |
| `MOCK_USERS_REQUIRED` | 400 | Faltan usuarios para generar pedidos | Se piden `orders` sin pedir `users` en la misma solicitud |
| `NO_STORES_AVAILABLE` | 400 | No hay comercios registrados | Se piden `orders` pero no hay comercios en la base |
| `MOCK_DELIVERIES_REQUIRED` | 400 | Faltan pedidos y repartidores | Se piden `deliveries` sin pedir `orders` y `drivers` en la misma solicitud |
| `MOCK_GENERATION_ERROR` | 500 | Error al generar los datos | MongoDB falla al insertar los datos de prueba |
| `FILE_REQUIRED` | 400 | Archivo requerido | No se envía ningún archivo, o la petición no es `multipart/form-data` |
| `INVALID_FILE_TYPE` | 400 | Tipo de archivo no permitido | El archivo no es PDF, JPG, PNG ni WEBP |
| `FILE_TOO_LARGE` | 413 | El archivo supera el máximo de 5 MB | El archivo pesa más que `MAX_FILE_SIZE` |
| `INVALID_FILE_FIELD` | 400 | Campo de archivo inválido | El archivo no viene en el campo esperado (`document` o `proof`) o el campo no tiene nombre |
| `INVALID_DOCUMENT_TYPE` | 400 | Tipo de documento inválido | El `type` enviado no es `user_document` ni `driver_license` |
| `UPLOAD_ERROR` | 500 | Error al guardar el archivo | Multer no puede procesar o guardar el archivo, por ejemplo con un form-data cortado |

### Códigos de estado HTTP

| Código | Cuándo se usa |
| --- | --- |
| 200 | Consulta, actualización o eliminación exitosa |
| 201 | Recurso creado |
| 400 | Datos inválidos, faltan campos obligatorios, el ID tiene un formato incorrecto, una cantidad de los mocks no es válida o el archivo cargado no es válido (falta, tipo no permitido o campo incorrecto) |
| 404 | El recurso solicitado no existe, o la ruta no existe |
| 409 | El email ya está registrado, o se repite el valor de otro campo único |
| 413 | El archivo cargado supera el tamaño máximo |
| 500 | Error inesperado, falla de MongoDB al generar datos de prueba o falla al guardar un archivo |

### Cómo probar los casos inválidos

Con Thunder Client, Postman o una herramienta similar. Para probar un recurso que no existe se puede usar un ID válido que no esté en la base, por ejemplo `64b000000000000000000000`. Cada caso responde con el status, el `code` y el `message` de las tablas anteriores.

| Request | Resultado esperado |
| --- | --- |
| `GET /api/nada` | `404`, `ROUTE_NOT_FOUND` |
| `POST /api/users` con el body `{"firstName": ` (JSON cortado) | `400`, `INVALID_JSON` |
| `GET /api/users/abc` | `400`, `INVALID_ID` |
| `GET /api/users/64b000000000000000000000` | `404`, `USER_NOT_FOUND` |
| `POST /api/users` con el body `{}` | `400`, `VALIDATION_ERROR` |
| `POST /api/users` con un email que ya existe | `409`, `EMAIL_ALREADY_EXISTS` |
| `GET /api/stores/64b000000000000000000000` | `404`, `STORE_NOT_FOUND` |
| `PUT /api/orders/:oid/status` con `{ "status": "volando" }` | `400`, `INVALID_ORDER_STATUS` |
| `POST /api/orders` con `"items": []` | `400`, `ORDER_ITEMS_REQUIRED` |
| `POST /api/orders` con un `customer` que no existe | `404`, `USER_NOT_FOUND` |
| `PUT /api/deliveries/:did/status` con `{ "status": "picked_up" }` | `400`, `INVALID_DELIVERY_STATUS` |
| `POST /api/deliveries` con un `driver` que no existe | `404`, `DRIVER_NOT_FOUND` |
| `POST /api/deliveries` con un `driver` que no tiene `role: "driver"` | `400`, `INVALID_DRIVER_ROLE` |

Casos del módulo de mocks:

| Request | Resultado esperado |
| --- | --- |
| `GET /api/mocks/mockingusers?qty=abc` (también `-5`, `0` o `2.5`) | `400`, `INVALID_MOCK_AMOUNT` |
| `GET /api/mocks/mockingorders?qty=5000` | `400`, `MOCK_AMOUNT_TOO_LARGE` |
| `POST /api/mocks/generateData` con `{}` | `400`, `INVALID_MOCK_AMOUNT` |
| `POST /api/mocks/generateData` con `{ "users": -5 }` | `400`, `INVALID_MOCK_AMOUNT` |
| `POST /api/mocks/generateData` con `{ "orders": 3 }` | `400`, `MOCK_USERS_REQUIRED` |
| `POST /api/mocks/generateData` con `{ "deliveries": 2 }` | `400`, `MOCK_DELIVERIES_REQUIRED` |
| `POST /api/mocks/generateData` con `{ "users": 2, "orders": 3 }`, sin comercios en la base | `400`, `NO_STORES_AVAILABLE` |

`MOCK_GENERATION_ERROR` aparece si MongoDB falla durante la carga, por ejemplo si se pierde la conexión con la base mientras se llama a `generateData`.

Casos de la carga de archivos:

| Request | Resultado esperado |
| --- | --- |
| `POST /api/users/:uid/documents` sin archivo | `400`, `FILE_REQUIRED` |
| `POST /api/users/:uid/documents` con un `.txt` en el campo `document` | `400`, `INVALID_FILE_TYPE` |
| `POST /api/users/:uid/documents` con un archivo de más de 5 MB | `413`, `FILE_TOO_LARGE` |
| `POST /api/users/:uid/documents` con el archivo en un campo que no es `document` | `400`, `INVALID_FILE_FIELD` |
| `POST /api/users/:uid/documents` con `type` igual a `delivery_proof` | `400`, `INVALID_DOCUMENT_TYPE` |
| `POST /api/users/:uid/documents` con `type` igual a `driver_license` para un usuario que no es repartidor | `400`, `INVALID_DRIVER_ROLE` |
| `POST /api/users/:uid/documents` con un usuario que no existe | `404`, `USER_NOT_FOUND` |
| `POST /api/orders/:oid/proof` con un pedido que no existe | `404`, `ORDER_NOT_FOUND` |
| `POST /api/orders/:oid/proof` sin archivo, o con un tipo, un tamaño o un campo (`proof`) inválido | Los mismos errores de arriba |

Todos estos casos están automatizados en la suite de tests, como se explica en [Testing](#testing).

## Logging

La aplicación registra lo que ocurre con [Winston](https://github.com/winstonjs/winston), configurado en un único módulo: `src/config/logger.js`. Ningún archivo usa `console.log` ni `console.error`: todos importan ese logger.

### Niveles

Van del más grave al menos grave. Cada nivel incluye a los más graves que él: con el nivel `info` se muestran `info`, `warning`, `error` y `fatal`.

| Nivel | Cuándo se usa | Ejemplo |
| --- | --- | --- |
| `fatal` | Falla crítica: la aplicación no puede seguir | No se puede conectar a MongoDB al arrancar |
| `error` | Error inesperado del servidor (500) | Falla la base mientras se atiende una petición |
| `warning` | Error esperado o de negocio (400, 404, 409) | Ruta inexistente, pedido no encontrado, cantidad de mocks inválida |
| `info` | Eventos normales e importantes | Servidor iniciado, MongoDB conectado, pedido creado |
| `http` | Cada petición HTTP recibida | `GET /api/users 200 - 12ms` |
| `debug` | Detalle para desarrollar | Cantidades pedidas al generar datos de prueba |

En Winston el número más bajo es el más grave (`fatal` = 0, `debug` = 5). Por eso `logger.js` define los niveles en ese orden.

### Formato

Cada línea tiene fecha y hora, el nivel entre corchetes y el mensaje:

```txt
2026-11-04 23:30:12 [info] MongoDB conectado
2026-11-04 23:30:12 [warning] ROUTE_NOT_FOUND - Ruta no encontrada - GET /api/nada
2026-11-04 23:30:12 [http] GET /api/nada 404 - 3ms
```

En la consola el nivel se muestra con color; en el archivo, no.

### Qué se registra

| Evento | Nivel | Dónde |
| --- | --- | --- |
| Servidor iniciado y MongoDB conectado | `info` | `server.js`, `config/db.js` |
| No se pudo iniciar el servidor (por ejemplo, falla la conexión a MongoDB) | `fatal` | `server.js` |
| Cada petición: método, ruta, status y duración | `http` | `middlewares/requestLogger.js` |
| Errores esperados: ruta inexistente, recurso no encontrado, cantidad de mocks inválida, email repetido, archivo inválido, etc. | `warning` | `middlewares/errorHandler.js` |
| Archivo rechazado por su tipo (con el tipo y el nombre original) | `warning` | `middlewares/upload.middleware.js` |
| No se pudo borrar un archivo del disco | `warning` | `utils/files.js` |
| Error inesperado del servidor y falla al generar datos de prueba | `error` | `middlewares/errorHandler.js`, `services/mocks.service.js` |
| Pedido creado, entrega creada, documento cargado, comprobante asociado a un pedido y datos de prueba generados | `info` | `services` |
| Cantidades que se piden al generar datos de prueba | `debug` | `services/mocks.service.js` |

El `errorHandler` registra cada error con el formato `CÓDIGO - mensaje - MÉTODO ruta`. Los errores del servidor (500) incluyen además el detalle y el stack del error original, que nunca se envía al cliente. No se registra el body de las peticiones, para no guardar datos sensibles como contraseñas. La respuesta que recibe el cliente es la misma de siempre.

Si el servidor no puede iniciar, `server.js` registra el `fatal` y termina con `process.exitCode = 1` (y no con `process.exit(1)`), para que la línea alcance a escribirse en el archivo antes de que el proceso termine.

### Dónde se guardan los logs

* **Consola:** los niveles habilitados para el entorno (ver más abajo).
* **Archivo:** `logs/error-AAAA-MM-DD.log`, que guarda **solo** `error` y `fatal`. La carpeta `logs/` se crea sola al arrancar.

### Rotación de archivos

Se usa `winston-daily-rotate-file`: se crea un archivo por día (por ejemplo `error-2026-11-04.log`) y se conservan los últimos 14 días; los más viejos se eliminan solos. Dentro de `logs/` también aparece un archivo `.xxxx-audit.json`, que la librería usa para controlar la rotación.

### Qué ignora Git

El `.gitignore` incluye:

```txt
logs
*.log
```

`logs` ignora la carpeta completa con todo lo que contiene, y `*.log` ignora cualquier archivo `.log` en cualquier lugar del proyecto. Los archivos de log los genera la aplicación y pueden contener detalles internos, así que no se suben al repositorio.

### Comportamiento según el entorno

El nivel mínimo sale de `NODE_ENV`, que se lee a través de `config`:

| `NODE_ENV` | Consola | Archivo |
| --- | --- | --- |
| `development` (y cualquier otro valor, salvo `test`) | Desde `debug`: los seis niveles | `error` y `fatal` |
| `production` | Desde `info`: sin `debug` ni `http` | `error` y `fatal` |
| `test` (lo define `tests/setup.js`) | Sin salida | No escribe archivos |

### Cómo probar el logger

`GET /loggerTest` genera un log de cada nivel y responde:

```json
{
  "status": "success",
  "message": "Logs generados correctamente"
}
```

1. Iniciar el servidor con `NODE_ENV=development` y hacer `GET http://localhost:8080/loggerTest`.
2. En la consola aparecen las seis líneas de prueba, de `debug` a `fatal`, más la línea `http` de la propia petición.
3. Se crea `logs/error-<fecha>.log` con **solo** dos líneas: la de `error` y la de `fatal`.
4. Detener el servidor y volver a iniciarlo en producción (en Git Bash: `NODE_ENV=production npm run dev`; o cambiar `NODE_ENV` en el `.env`). Con la misma petición, la consola muestra solo `info`, `warning`, `error` y `fatal`, y el archivo recibe las mismas dos líneas.

Para ver un `fatal` real, poner una `MONGODB_URI` inválida en el `.env` e iniciar el servidor: registra el error, no arranca y termina con código de error.

## Documentación con Swagger

La API está documentada con OpenAPI 3.0 y se puede consultar y probar desde el navegador con Swagger UI.

**Ruta:** `http://localhost:8080/api/docs` (el puerto es el que se define en `PORT` del `.env`).

### Cómo acceder

1. Iniciar el servidor, como se explica en [Instalación y ejecución](#instalación-y-ejecución).
2. Abrir `http://localhost:8080/api/docs` en el navegador.

### Qué está documentado

La documentación está agrupada en cinco tags, y cada uno tiene su archivo en `src/docs/`:

| Tag | Endpoints | Archivo |
| --- | --- | --- |
| Users | `/api/users`, `/api/users/{uid}`, `/api/users/{uid}/documents` | `users.yaml` |
| Orders | `/api/orders`, `/api/orders/{oid}`, `/api/orders/{oid}/status`, `/api/orders/{oid}/proof` | `orders.yaml` |
| Deliveries | `/api/deliveries`, `/api/deliveries/{did}`, `/api/deliveries/{did}/status` | `deliveries.yaml` |
| Mocks | `/api/mocks/mockingusers`, `/api/mocks/mockingorders`, `/api/mocks/generateData` | `mocks.yaml` |
| Logger | `/loggerTest` | `logger.yaml` |

`/loggerTest` es una herramienta de validación del logger, no una funcionalidad de negocio, y está en la raíz del servidor, fuera de `/api`. Los endpoints de Mocks son herramientas de desarrollo. No están documentados `/api/stores` ni `/health`, que sí figuran en [Endpoints](#endpoints).

De cada endpoint se documenta el método y la ruta, una descripción, los parámetros (de ruta o de query), el body esperado, la respuesta exitosa y los errores posibles, con el `code` real de cada uno. Cuando un mismo status puede corresponder a varios errores, se elige cada uno en un desplegable. Por ejemplo, el 400 de `PUT /api/orders/{oid}/status` puede ser `INVALID_ORDER_STATUS`, `INVALID_ID` o `INVALID_JSON`. La API no tiene autenticación, por eso no hay respuestas 401 ni 403.

Los schemas reutilizables están en `src/docs/schemas.yaml`:

| Schema | Qué describe |
| --- | --- |
| `User`, `Order`, `OrderItem`, `Delivery` | Las entidades principales |
| `Store` | El comercio, que aparece dentro de un pedido cuando se consulta con sus datos completos |
| `Document` | La metadata de un archivo cargado, que usan `User.documents` y `Order.proof` |
| `SuccessResponse` | La base de toda respuesta exitosa, `{ status: "success" }`, a la que cada endpoint le suma su `payload` |
| `ErrorResponse` | La respuesta de error, `{ status, message, code }`, con los códigos de [Manejo de errores](#manejo-de-errores) |

También define cuatro respuestas reutilizables: `InvalidId` (400, ID con formato inválido), `InternalServerError` (500), `FileTooLarge` (413, archivo demasiado grande) y `UploadServerError` (500 de los endpoints de carga: error inesperado o `UPLOAD_ERROR`).

Los dos endpoints de carga se documentan como `multipart/form-data`: indican el campo del archivo (`document` o `proof`), el campo extra `type` y sus valores permitidos, el formato y el tamaño máximo, la respuesta exitosa y cada error posible.

### Cómo está armada

* `src/docs/swagger.config.js` tiene la configuración general: nombre, versión, descripción, servidor local (`http://localhost:` más el `PORT`) y los tags. Usa `swagger-jsdoc`, que arma la especificación a partir de los archivos `src/docs/**/*.yaml`. Esa ruta es relativa a la carpeta desde donde se inicia el servidor, por lo que hay que usar `npm run dev` o `npm start` desde la raíz del proyecto.
* `src/app.js` monta Swagger UI en `/api/docs` con `swagger-ui-express`. La ruta va antes de `notFoundHandler`; si estuviera después, respondería `ROUTE_NOT_FOUND`.
* La configuración de Swagger está separada de las rutas y los controllers, así que no hay documentación mezclada con la lógica de la API.
* `tests/swagger.test.js` comprueba que `/api/docs` responde y que los endpoints y las respuestas documentadas coinciden con los que cubre la suite de tests (ver [Testing](#testing)).

### Cómo probar los endpoints desde Swagger

En cada endpoint, tocar **Try it out**, completar los datos y tocar **Execute**. Algunas aclaraciones:

* Los IDs de los ejemplos (como `665f4d0a8f9a1b001234abce`) pueden ser ficticios. Si un ID no existe en la base, hay que reemplazarlo por uno real, que se obtiene con los `GET` de cada módulo.
* Para crear un pedido hacen falta un usuario y un comercio existentes. Los comercios no están en Swagger: se crean y se consultan con `/api/stores` desde Thunder Client o similar.
* Para crear una entrega hacen falta un pedido y un usuario con `role: "driver"`, que se puede crear con `POST /api/users` o con `generateData`.
* En los `GET` de Mocks, Swagger UI solo deja enviar `qty` si es un número entero, así que `abc` o `2.5` no se pueden probar desde ahí y se prueban con Thunder Client. En cambio `0`, `-5` y `5000` sí, y devuelven `INVALID_MOCK_AMOUNT` y `MOCK_AMOUNT_TOO_LARGE`.
* `POST /api/mocks/generateData` guarda datos de prueba en la base. Los `GET` de Mocks no guardan nada.
* En los endpoints de carga, Swagger UI muestra un selector de archivo en el campo `document` o `proof`: usar el botón para seleccionar el archivo (el texto depende del idioma del navegador; en español dice **Seleccionar archivo**), elegir un PDF, JPG, PNG o WEBP de hasta 5 MB y ejecutar. El archivo se guarda de verdad en `uploads/`.

## Testing

La API tiene tests funcionales (de integración): cada test hace una petición HTTP a la aplicación de Express, que trabaja con una base de datos de testing real, y verifica el status y el body de la respuesta. Se escribieron con Mocha, Chai y Supertest.

### Herramientas

| Herramienta | Para qué se usa |
| --- | --- |
| Mocha | Es el runner: organiza los tests en `describe` e `it`, ejecuta los hooks (`beforeEach`, etc.) y muestra el resultado |
| Chai | Aserciones con `expect`, por ejemplo `expect(res.status).to.equal(201)` |
| Supertest | Hace las peticiones HTTP a `app` sin levantar el servidor (por eso `app.js` y `server.js` están separados) |
| `mock` de `node:test` | Reemplaza temporalmente un método de un repository o del logger, para provocar un error `500` o comprobar qué se registra. Viene con Node, no se instala |

### Cómo ejecutar los tests

Requiere Node.js 20 o superior y una base de datos de testing (ver la sección siguiente).

1. Instalar las dependencias:

```bash
npm install
```

2. Crear el archivo `.env.test` a partir de la plantilla `.env.test.example`:

```bash
cp .env.test.example .env.test
```

3. Completar `MONGODB_URI` en el `.env.test` con la URI de la base de testing.

4. Correr la suite:

```bash
npm test
```

Al terminar, el resumen tiene que mostrar todos los tests en `passing` y ninguno en `failing` (180 en esta versión). La suite se puede correr todas las veces que haga falta, una detrás de otra, sin limpiar nada a mano.

Para correr solo un recurso se filtra por el nombre de su `describe` (`Users`, `Orders`, `Deliveries`, `Stores`, `Mocks`, `Swagger` o `Carga de archivos`):

```bash
npm test -- --grep "^Orders"
```

No sirve pasar la ruta de un archivo, porque `.mocharc.json` ya indica qué archivos correr (`tests/**/*.test.js`) y Mocha los suma. Ese archivo también define `tests/setup.js` como archivo de preparación y el tiempo máximo por test.

### Base de datos de testing y variables de entorno

**Los tests requieren una base de datos de testing.** La API guarda todo en MongoDB y los tests comprueban justamente eso (por ejemplo, que un usuario creado se pueda consultar después), así que no usan una base simulada. Tiene que ser una base distinta de la real, porque la suite borra el contenido de las colecciones. En MongoDB Atlas alcanza con usar otra base dentro del mismo cluster: se cambia el nombre en la URI (por ejemplo `shipnow-test` en lugar de la base real) y Atlas la crea sola al primer uso. Con MongoDB local sirve algo como `mongodb://localhost:27017/shipnow-test`.

El `.env.test` queda así:

```txt
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/shipnow-test?retryWrites=true&w=majority
NODE_ENV=test
```

| Variable | Descripción |
| --- | --- |
| `MONGODB_URI` | URI de la base de testing. El nombre de la base tiene que terminar en `test` |
| `PORT` | Los tests no levantan el servidor, así que el valor no importa, pero `config` exige que exista |
| `NODE_ENV` | `test`. `tests/setup.js` lo fuerza igual; con `test` el logger no imprime ni escribe archivos |

El `.env.test` tiene credenciales, así que está en el `.gitignore` y no se sube. `.env.test.example` es la plantilla sin valores y sí se sube.

`tests/setup.js` protege la base real:

* La URI siempre sale de `.env.test`, aunque exista un `.env` con la base real.
* Si falta el archivo o falta `MONGODB_URI`, la suite no corre y explica qué falta.
* Si el nombre de la base no termina en `test`, la suite no corre.

### Datos controlados y limpieza

* Cada archivo de `tests/` agrupa un recurso y tiene un `beforeEach` que vacía las colecciones (`clearDatabase`). Cada test arranca con la base vacía, así que no depende del estado previo ni del orden de ejecución.
* Los datos se crean dentro de cada test usando la propia API, con las funciones de `tests/helpers.js` (`createUser`, `createOrder`, `createDelivery`, etc.). Nunca se cargan a mano. Por ejemplo, para probar un pedido primero se crean un cliente y un comercio, y el pedido se arma con sus IDs.
* Antes de todos los tests (`beforeAll`) se conecta a la base, se crean los índices (como el índice único del email) y se vacía todo. Al terminar (`afterAll`) se vacía de nuevo y se desconecta. Por eso la base queda limpia y una segunda corrida seguida da el mismo resultado.
* La limpieza usa `deleteMany`, y no borrar la base entera, para no perder los índices.
* Los tests de carga arman los archivos en memoria (no hay archivos de prueba en el repositorio) y, después de cada test, borran de `uploads/` solo los archivos que ese test creó, así que no tocan lo que ya hubiera en esas carpetas.
* Los errores `500` y los casos que MongoDB no produce a pedido se simulan con `mock.method`. Para comprobar qué registra el logger, `tests/logging.test.js` reemplaza sus métodos por espías que anotan con qué mensaje fueron llamados. Después de cada test se restauran los métodos originales.

### Módulos cubiertos

| Archivo | Qué cubre |
| --- | --- |
| `tests/users.test.js` | `GET` y `POST /api/users`; `GET`, `PUT` y `DELETE /api/users/:uid` |
| `tests/orders.test.js` | `GET` y `POST /api/orders`; `GET` y `DELETE /api/orders/:oid`; `PUT /api/orders/:oid/status`, con los seis estados |
| `tests/deliveries.test.js` | `GET` y `POST /api/deliveries`; `GET` y `DELETE /api/deliveries/:did`; `PUT /api/deliveries/:did/status`, con los cuatro estados |
| `tests/mocks.test.js` | `GET /api/mocks/mockingusers`, `GET /api/mocks/mockingorders` y `POST /api/mocks/generateData`: estructura de los datos, cantidades válidas e inválidas y datos guardados en la base |
| `tests/logging.test.js` | `GET /loggerTest` y lo que registra el logger: errores según su tipo, eventos de pedido, entrega y `generateData`, y cada petición (`http`) |
| `tests/swagger.test.js` | `GET /api/docs` y la coherencia entre los endpoints documentados y los que cubre la suite |
| `tests/uploads.test.js` | `POST /api/users/:uid/documents` y `POST /api/orders/:oid/proof`: carga exitosa, reemplazo del comprobante, cada error de validación, que no queden archivos sueltos, el borrado de los archivos al eliminar el usuario o el pedido y lo que registra el logger |
| `tests/errors.test.js` | Ruta inexistente (`ROUTE_NOT_FOUND`), error `11000` de otros campos (`DUPLICATE_KEY`) y error inesperado (`INTERNAL_SERVER_ERROR`) |
| `tests/stores.test.js` | `GET /api/stores/:sid` con un comercio que no existe. Stores no está en Swagger ni es parte de lo pedido: el resto se usa como dato de apoyo para crear pedidos |
| `tests/entorno.test.js` | Conexión a la base de testing, `GET /health` y la limpieza de colecciones |

### Qué verifica cada test

* **Respuestas exitosas:** el status HTTP, `status: "success"` y la estructura del `payload`: las propiedades exactas de cada entidad, el formato de los IDs (24 caracteres hexadecimales) y de las fechas (ISO), los valores calculados (como el `total` de un pedido) y que nunca se devuelva el `password`. En los `GET` por ID se verifica además lo que trae `populate` (cliente, comercio, pedido o repartidor completos).
* **Errores esperados:** el status HTTP y que el body sea exactamente `{ status, message, code }`, con el mensaje del diccionario de errores. Cubre datos incompletos, IDs inválidos, JSON mal formado, recursos inexistentes, estados inválidos, cantidades inválidas de los mocks y rutas inexistentes.
* **Archivos:** que el archivo quede en `uploads/` con el nombre generado y la metadata correcta, que los errores no dejen archivos sueltos, que reemplazar un comprobante borre el anterior y que eliminar un usuario o un pedido borre sus archivos.
* **Coherencia con Swagger:** cada respuesta documentada en `src/docs/*.yaml` tiene su test (por ejemplo, un `404` documentado tiene un test que lo provoca y verifica su `code`). Además, `tests/swagger.test.js` compara la lista de endpoints y status documentados con una tabla de lo que cubre la suite: si se documenta algo nuevo y no se agrega su test, falla.

## Autor

Marcos Santiago Carrizo
[MSantiagoCarrizo](https://github.com/MSantiagoCarrizo)