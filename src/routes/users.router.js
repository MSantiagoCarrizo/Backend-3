import { Router } from "express";
import UserModel from "../models/user.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await UserModel.find();
    res.json({ status: "success", payload: users });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:uid", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.uid);

    if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }

    res.json({ status: "success", payload: user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = await UserModel.create(req.body);
    res.status(201).json({ status: "success", payload: user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.put("/:uid", async (req, res) => {
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.uid, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }

    res.json({ status: "success", payload: user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.delete("/:uid", async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.uid);

    if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }

    res.json({ status: "success", payload: user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

export default router;
