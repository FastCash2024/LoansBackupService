import moment from "moment-timezone";
import VerificationCollection from '../models/VerificationCollection.js';
import { VerificationCollectionBackup } from '../models/verificationCollectionBackupSchema.js';

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

    const { page = 1, limit = 10 } = req.query;

    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const totalDocs = await VerificationCollection.countDocuments();
    const data = await VerificationCollectionBackup.find()
      .sort({ _id: -1 })
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt);

    const totalPages = Math.ceil(totalDocs / limitInt)
    res.status(200).json({
      data,
      currentPage: pageInt,
      totalPages,
      totalDocs
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener casos.', details: error.message });
  }
}
