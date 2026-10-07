# ShipNow API

API REST para la gestión de logística y envíos. Permite administrar usuarios, comercios, pedidos y entregas, y está construida con Node.js, Express y MongoDB (Mongoose).

El proyecto está organizado en una arquitectura por capas (Controller → Service → Repository), valida su configuración de entorno al arrancar y maneja todos los errores en una capa común, con respuestas uniformes.

## Tecnologías

* Node.js (ES Modules)
* Express 4
* MongoDB con Mongoose 8
* dotenv, para las variables de entorno
* cors, para habilitar peticiones desde otros orígenes (por ejemplo, un frontend en otro dominio o puerto)
* nodemon, en desarrollo

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

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que corre el servidor |
| `MONGODB_URI` | URI de conexión a MongoDB, incluyendo el nombre de la base de datos |
| `NODE_ENV` | Entorno de ejecución (por ejemplo `development`) |

Las tres variables son obligatorias y se validan una sola vez, al iniciar la aplicación, en `src/config/index.js`. Si falta alguna, la aplicación no arranca y muestra un error descriptivo:

```txt
Falta configurar la variable de entorno: MONGODB_URI
```

El archivo `.env` no se sube al repositorio. `.env.example` documenta las variables que necesita el proyecto, sin valores reales. El resto del código lee la configuración importando el objeto `config` y nunca accede a `process.env` directamente.

## Arquitectura

Cada petición recorre las capas en este orden, y cada capa solo conoce a la siguiente:

```txt
Request → Router → Controller → Service → Repository → Model → MongoDB
```

### Estructura de carpetas

```txt
.
├── .env.example
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
└── src/
    ├── config/
    │   ├── index.js              Carga y valida las variables de entorno
    │   └── db.js                 Conexión a MongoDB
    ├── constants/
    │   └── index.js              Roles, estados, prioridades y límites del dominio
    ├── controllers/
    │   ├── delivery.controller.js
    │   ├── mocks.controller.js
    │   ├── order.controller.js
    │   ├── store.controller.js
    │   └── user.controller.js
    ├── middlewares/
    │   ├── errorHandler.js       Middleware global: único lugar que responde los errores
    │   └── notFoundHandler.js    Convierte las rutas inexistentes en un error 404
    ├── mocks/
    │   ├── user.mock.js          Genera usuarios y repartidores de prueba
    │   ├── order.mock.js         Genera pedidos de prueba
    │   └── delivery.mock.js      Genera entregas de prueba
    ├── models/
    │   ├── delivery.model.js
    │   ├── order.model.js
    │   ├── store.model.js
    │   └── user.model.js
    ├── repositories/
    │   ├── delivery.repository.js
    │   ├── order.repository.js
    │   ├── store.repository.js
    │   └── user.repository.js
    ├── routes/
    │   ├── delivery.router.js
    │   ├── mocks.router.js
    │   ├── orders.router.js
    │   ├── stores.router.js
    │   └── users.router.js
    ├── services/
    │   ├── delivery.service.js
    │   ├── mocks.service.js
    │   ├── order.service.js
    │   ├── store.service.js
    │   └── user.service.js
    ├── utils/
    │   ├── errorDictionary.js    Códigos de error, con su status y su mensaje
    │   └── apiResponse.js        createError y errorResponse
    ├── app.js                    Configuración de Express y montaje de rutas
    └── server.js                 Punto de entrada: conecta la base y levanta el servidor
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

Los valores fijos del negocio están centralizados en `src/constants/index.js` como objetos congelados con `Object.freeze` (más un límite numérico, `MOCK_MAX_QUANTITY`). Los modelos y los services los usan en lugar de escribir strings sueltos.

| Constante | Valores |
| --- | --- |
| `USER_ROLES` | `admin`, `customer`, `store`, `driver` |
| `ORDER_STATUS` | `created`, `assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled` |
| `DELIVERY_PRIORITY` | `low`, `normal`, `high` |
| `DELIVERY_STATUS` | `assigned`, `in_transit`, `delivered`, `cancelled` |
| `MOCK_MAX_QUANTITY` | `1000`: cantidad máxima de cada tipo de dato que pueden generar los mocks |

## Modelo de datos

### User

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `firstName`, `lastName` | String | Obligatorios |
| `email` | String | Obligatorio y único |
| `password` | String | Obligatorio |
| `role` | String | Uno de `USER_ROLES`, por defecto `customer` |
| `documents` | Array | Por defecto vacío |

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
| `proof` | Object | Por defecto `null` |

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

La URL base en local es `http://localhost:8080`. Los endpoints se pueden probar con Thunder Client, Postman o herramientas similares.

### General

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Verifica que la API está funcionando |

### Users

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/users` | Lista los usuarios |
| GET | `/api/users/:uid` | Obtiene un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:uid` | Actualiza un usuario |
| DELETE | `/api/users/:uid` | Elimina un usuario |

Las consultas y actualizaciones de usuarios no incluyen el campo `password`.

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

El código HTTP de la respuesta (400, 404, 409 o 500) también sale del diccionario de errores, junto con el mensaje.

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
| Email repetido (error `11000` de Mongo) | `EMAIL_ALREADY_EXISTS` |
| JSON mal formado en el body | `INVALID_JSON` |
| Cualquier error inesperado | `INTERNAL_SERVER_ERROR` |

Los errores inesperados se muestran completos en la consola del servidor, pero al cliente solo le llega el mensaje genérico, para no exponer detalles internos.

### Códigos de error

| Código | Status | Mensaje | Cuándo ocurre |
| --- | --- | --- | --- |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor | Error inesperado: un bug, la base caída, etc. |
| `ROUTE_NOT_FOUND` | 404 | Ruta no encontrada | La ruta pedida no existe |
| `VALIDATION_ERROR` | 400 | Datos inválidos o faltantes | Faltan campos obligatorios, o Mongoose rechaza un dato (por ejemplo un `role` o una `priority` inexistente) |
| `INVALID_ID` | 400 | ID inválido | Un ID tiene un formato incorrecto |
| `INVALID_JSON` | 400 | JSON inválido | El body no es un JSON válido |
| `EMAIL_ALREADY_EXISTS` | 409 | El email ya está registrado | Se crea o actualiza un usuario con un email ya registrado |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado | El usuario no existe |
| `STORE_NOT_FOUND` | 404 | Comercio no encontrado | El comercio no existe |
| `ORDER_NOT_FOUND` | 404 | Pedido no encontrado | El pedido no existe |
| `DELIVERY_NOT_FOUND` | 404 | Entrega no encontrada | La entrega no existe |
| `DRIVER_NOT_FOUND` | 404 | Repartidor no encontrado | El repartidor indicado en una entrega no existe |
| `ORDER_ITEMS_REQUIRED` | 400 | El pedido necesita productos | Un pedido se crea sin productos |
| `INVALID_ORDER_STATUS` | 400 | Estado de pedido inválido | El estado enviado no es uno de `ORDER_STATUS` |
| `INVALID_DELIVERY_STATUS` | 400 | Estado de entrega inválido | El estado enviado no es uno de `DELIVERY_STATUS` |
| `INVALID_DRIVER_ROLE` | 400 | El usuario no es repartidor | El usuario indicado como repartidor no tiene `role: "driver"` |
| `INVALID_MOCK_AMOUNT` | 400 | Cantidad inválida | Una cantidad de los mocks no es un entero válido (texto, negativa, decimal o todas en 0) |
| `MOCK_AMOUNT_TOO_LARGE` | 400 | Cantidad máxima: 1000 | Una cantidad de los mocks supera el máximo de 1000 |
| `MOCK_USERS_REQUIRED` | 400 | Faltan usuarios para generar pedidos | Se piden `orders` sin pedir `users` en la misma solicitud |
| `NO_STORES_AVAILABLE` | 400 | No hay comercios registrados | Se piden `orders` pero no hay comercios en la base |
| `MOCK_DELIVERIES_REQUIRED` | 400 | Faltan pedidos y repartidores | Se piden `deliveries` sin pedir `orders` y `drivers` en la misma solicitud |
| `MOCK_GENERATION_ERROR` | 500 | Error al generar los datos | MongoDB falla al insertar los datos de prueba |

### Códigos de estado HTTP

| Código | Cuándo se usa |
| --- | --- |
| 200 | Consulta, actualización o eliminación exitosa |
| 201 | Recurso creado |
| 400 | Datos inválidos, faltan campos obligatorios, el ID tiene un formato incorrecto o una cantidad de los mocks no es válida |
| 404 | El recurso solicitado no existe, o la ruta no existe |
| 409 | El email ya está registrado |
| 500 | Error inesperado, o falla de MongoDB al generar datos de prueba |

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

## Autor

Marcos Santiago Carrizo
[MSantiagoCarrizo](https://github.com/MSantiagoCarrizo)