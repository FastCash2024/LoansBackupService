import express from "express";
import { getRecoleccionesYGuardarBackup } from "../controllers/backoupController.js";

const router = express.Router();

router.get('/getTodos', getRecoleccionesYGuardarBackup);

export default router;