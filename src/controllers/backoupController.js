import User from "../models/AuthCollection.js";

export const saveBackoup = async (req, res) => { 
  try {
    let usuarios = req.body; 
    
    if (!Array.isArray(usuarios)) {
      usuarios = [usuarios]; 
    }
    console.log("usuarios::", usuarios)
    
    const usuariosGuardados = await User.insertMany(usuarios);
    res.status(201).json({ message: "Usuarios registrados con éxito", usuarios: usuariosGuardados });
  } catch (error) {
      res.status(500).json({ error: "Error al registrar usuarios", details: error.message });
  }
};



