import { Router } from "express";
import { getOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder } from "../controllers/order.controller.js";

const router = Router();

router.get("/", getOrders);

router.get("/:oid", getOrderById);

router.post("/", createOrder);

router.put("/:oid/status", updateOrderStatus);

router.delete("/:oid", deleteOrder);

export default router;
