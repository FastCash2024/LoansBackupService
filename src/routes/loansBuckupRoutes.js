import express from "express";
import { getForVerificationBackups, getRecoleccionesYGuardarBackup, getVerificationBackups } from "../controllers/backoupController.js";

const router = express.Router();

// Casos de Recoleccion backup
router.get('/getTodos', getRecoleccionesYGuardarBackup);
// Casos de Verificacion backup
router.get('/getCasos', getVerificationBackups)
router.get('/getCasosVerificador', getForVerificationBackups);

export default router;