import { Router } from "express";
import { getOrders, getOrderById, createOrder, updateOrderStatus, uploadOrderProof, deleteOrder } from "../controllers/order.controller.js";
import { uploadProof } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/", getOrders);

router.get("/:oid", getOrderById);

router.post("/", createOrder);

router.put("/:oid/status", updateOrderStatus);

router.post("/:oid/proof", uploadProof, uploadOrderProof);

router.delete("/:oid", deleteOrder);

export default router;