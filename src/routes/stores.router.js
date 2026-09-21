import { Router } from "express";
import StoreModel from "../models/store.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const stores = await StoreModel.find();
    res.json({ status: "success", payload: stores });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:sid", async (req, res) => {
  try {
    const store = await StoreModel.findById(req.params.sid);

    if (!store) {
      return res.status(404).json({ status: "error", message: "Comercio no encontrado" });
    }

    res.json({ status: "success", payload: store });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const store = await StoreModel.create(req.body);
    res.status(201).json({ status: "success", payload: store });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.put("/:sid", async (req, res) => {
  try {
    const store = await StoreModel.findByIdAndUpdate(req.params.sid, req.body, {
      new: true,
      runValidators: true
    });

    if (!store) {
      return res.status(404).json({ status: "error", message: "Comercio no encontrado" });
    }

    res.json({ status: "success", payload: store });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.delete("/:sid", async (req, res) => {
  try {
    const store = await StoreModel.findByIdAndDelete(req.params.sid);

    if (!store) {
      return res.status(404).json({ status: "error", message: "Comercio no encontrado" });
    }

    res.json({ status: "success", payload: store });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

export default router;
