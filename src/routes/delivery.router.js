import { Router } from "express";
import { getDeliveries, getDeliveryById, createDelivery, updateDeliveryStatus, deleteDelivery } from "../controllers/delivery.controller.js";

const router = Router();

router.get("/", getDeliveries);
router.get("/:did", getDeliveryById);
router.post("/", createDelivery);
router.put("/:did/status", updateDeliveryStatus);
router.delete("/:did", deleteDelivery);

export default router;