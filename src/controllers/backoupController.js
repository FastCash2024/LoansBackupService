import moment from "moment-timezone";
import cron from "node-cron";
import VerificationCollection from '../models/VerificationCollection.js';
import { VerificationCollectionBackup } from '../models/verificationCollectionBackupSchema.js';
import GestionDeAccesosBackupCollection from "../models/GestionDeAccesosBackupCollection.js";

export const getRecoleccionesYGuardarBackup = async (req, res) => {
  try {
    let { fecha, tipo } = req.query;

    console.log("Tipo: ", tipo);

    if (!tipo || (tipo !== 'cobro' && tipo !== 'verificacion')) {
      return res.status(400).json({
        message: 'Debe especificar el tipo de backup: "cobro" o "verificacion".',
        status: false
      });
    }

    if (!fecha) {
      fecha = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
    }

    console.log("Fecha: ", fecha);

    const [year, month, day] = fecha.split("-").map(Number);
    const inicioDelDia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const finDelDia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    let filtroFecha = {};
    let filtroEstado = {};

    if (tipo === 'cobro') {
      filtroFecha = {
        $expr: {
          $and: [
            { $gte: [{ $dateFromString: { dateString: "$fechaDeTramitacionDeCobro" } }, inicioDelDia] },
            { $lte: [{ $dateFromString: { dateString: "$fechaDeTramitacionDeCobro" } }, finDelDia] }
          ]
        }
      };
      filtroEstado = { estadoDeCredito: { $in: ["Pagado", "Pagado con Extensión", "Dispersado"] } };
    } else if (tipo === 'verificacion') {
      filtroFecha = {
        $expr: {
          $and: [
            { $gte: [{ $dateFromString: { dateString: "$fechaDeTramitacionDelCaso" } }, inicioDelDia] },
            { $lte: [{ $dateFromString: { dateString: "$fechaDeTramitacionDelCaso" } }, finDelDia] }
          ]
        }
      };
      filtroEstado = { estadoDeCredito: { $in: ["Pendiente", "Dispersado", "Aprobado", "Reprobado"] } };
    }

    const credits = await VerificationCollection.find({
      ...filtroFecha,
      ...filtroEstado
    });

    if (credits.length === 0) {
      return res.status(404).json({
        message: 'No se encontraron registros para guardar.',
        status: false
      });
    }

    let registrosGuardados = 0;
    let registrosActualizados = 0;

    console.log("Créditos encontrados:", credits);

    for (const credit of credits) {
      const { numeroDePrestamo, _id } = credit;

      const backupExistente = await VerificationCollectionBackup.findOne({ numeroDePrestamo });

      const backupData = {
        ...credit.toObject(),
        subId: _id,
        fechaBackoup: moment().tz("America/Mexico_City").format(),
      };

      if (!backupExistente) {
        await VerificationCollectionBackup.create(backupData);
        registrosGuardados++;
      } else {
        await VerificationCollectionBackup.updateOne(
          { numeroDePrestamo },
          { $set: backupData }
        );
        registrosActualizados++;
      }
    }

    res.status(201).json({
      message: 'Backup realizado con éxito.',
      registrosGuardados,
      registrosActualizados,
      status: true
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en el backup', details: error.message });
  }
};

export const getVerificationBackups = async (req, res) => {
  try {
    const { email, page = 1, limit = 10 } = req.query;

    if (!email) {
      return res.status(400).json({ message: "El parámetro email es requerido" });
    }

    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);

    const usuarios = await GestionDeAccesosBackupCollection.find({
      emailPersonal: email,
      tipoDeGrupo: "Asesor de Cobranza"
    });

    if (usuarios.length === 0) {
      return res.status(404).json({ message: "No se encontraron usuarios con este email" });
    }

    let resultados = [];

    for (const usuario of usuarios) {
      const { emailPersonal, fechaBackup, cuenta } = usuario;
      const fechaBackupStr = fechaBackup.split("T")[0];

      const casosPagados = await VerificationCollectionBackup.find({
        cuentaCobrador: cuenta,
        fechaBackoup: { $regex: `^${fechaBackupStr}` },
        estadoDeCredito: "Pagado"
      });

      const casosPagadosValidos = casosPagados.filter(caso => {
        const fechaDeReembolso = new Date(caso.fechaDeReembolso);
        const hora = fechaDeReembolso.getHours();
        return hora >= 7 && hora < 24;
      });

      const cantidadCasosPagados = casosPagadosValidos.length;

      const cantidadDeCasosAsignados = await VerificationCollectionBackup.countDocuments({
        cuentaCobrador: cuenta,
        fechaBackoup: { $regex: `^${fechaBackupStr}` }
      });

      resultados.push({
        emailPersonal,
        cuenta,
        fechaBackup,
        cantidadCasosPagados,
        cantidadDeCasosAsignados
      });
    }

    const totalDocs = resultados.length;
    const totalPages = Math.ceil(totalDocs / limitInt);
    const paginatedData = resultados.slice((pageInt - 1) * limitInt, pageInt * limitInt);

    res.status(200).json({
      data: paginatedData,
      currentPage: pageInt,
      totalPages,
      totalDocs
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los backups de verificación.', details: error.message });
  }
};


export const getForVerificationBackups = async (req, res) => {
  try {
    const { email, page = 1, limit = 10 } = req.query;

    if (!email) {
      return res.status(400).json({ message: "El parámetro email es requerido" });
    }

    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);

    const usuarios = await GestionDeAccesosBackupCollection.find({
      emailPersonal: email,
      tipoDeGrupo: "Asesor de Verificación"
    });

    if (usuarios.length === 0) {
      return res.status(404).json({ message: "No se encontraron usuarios con este email" });
    }

    let resultados = [];

    for (const usuario of usuarios) {
      const { emailPersonal, fechaBackup, cuenta } = usuario;
      const fechaBackupStr = fechaBackup.split("T")[0];

      const casosDispersados = await VerificationCollectionBackup.find({
        cuentaVerificador: cuenta,
        fechaBackoup: { $regex: `^${fechaBackupStr}` },
        estadoDeCredito: "Dispersado"
      });

      const casosDispersadosValidos = casosDispersados.filter(caso => {
        const fechaDeDispersion = new Date(caso.fechaDeDispersion);
        const hora = fechaDeDispersion.getHours();
        return hora >= 7 && hora < 24;
      });

      const cantidadCasosDispersados = casosDispersadosValidos.length;
      const cantidadDeCasosAsignados = await VerificationCollectionBackup.countDocuments({
        cuentaVerificador: cuenta,
        fechaBackoup: { $regex: `^${fechaBackupStr}` }
      });

      resultados.push({
        emailPersonal,
        cuenta,
        fechaBackup,
        cantidadCasosDispersados,
        cantidadDeCasosAsignados
      });
    }

    const totalDocs = resultados.length;
    const totalPages = Math.ceil(totalDocs / limitInt);
    const paginatedData = resultados.slice((pageInt - 1) * limitInt, pageInt * limitInt);

    res.status(200).json({
      data: paginatedData,
      currentPage: pageInt,
      totalPages,
      totalDocs
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los backups de verificación.', details: error.message });
  }
};

cron.schedule("0 0 * * *", () => {
  console.log("Ejecutando asignación de casos a la medianoche...");
  getRecoleccionesYGuardarBackup();
  getVerificationBackups();
  getForVerificationBackups();
}, {
  timezone: "America/Mexico_City"
});

console.log("Tarea programada para ejecutarse a la medianoche (00:00) hora de México");
