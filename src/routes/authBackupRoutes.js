import express from "express";
import { getCuentasYGuardarBackup } from "../controllers/backupGestionDeAccesosController.js";
const router = express.Router();

router.get('/getUsers', getCuentasYGuardarBackup);

export default router;