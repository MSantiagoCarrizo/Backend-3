import app from "./app.js";
import connectDB from "./config/db.js";
import { config } from "./config/index.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`Servidor escuchando en el puerto ${config.port}`);
    });
  } catch (error) {
    console.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();