import express from "express";
import { getCuentasYGuardarBackup } from "../controllers/backupGestionDeAccesosController.js";
const router = express.Router();

// Cuentas baackups 
router.get('/getUsers', getCuentasYGuardarBackup);

export default router;