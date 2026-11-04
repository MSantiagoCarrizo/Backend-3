import mongoose from "mongoose";
import { config } from "./index.js";
import logger from "./logger.js";

const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  logger.info("MongoDB conectado");
};

export default connectDB;