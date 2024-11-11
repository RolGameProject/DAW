const User = require('../models/userModel'); 
const crypto = require('crypto'); 

// Función para generar un hash
const createSHA256Hash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex'); // Convertir la entrada en un hash hexadecimal
};

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
    const { displayName, email, googleId } = req.body; // Extraer los datos

    // Generar hashes para los datos sensibles antes de almacenarlos
    const hashedGoogleId = createSHA256Hash(googleId);
    const hashedDisplayName = createSHA256Hash(displayName);
    const hashedEmail = createSHA256Hash(email);

    try {
        // Verificar si ya existe un usuario con el mismo correo (hasheado)
        const existingUser = await User.findOne({ email: hashedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuario ya registrado' });
        }

        // Crear un nuevo usuario con los datos hasheados
        const newUser = new User({
            displayName: hashedDisplayName,
            email: hashedEmail,
            googleId: hashedGoogleId,
        });

        await newUser.save(); // Guardar el usuario en la base de datos
        res.status(201).json(newUser); // Responder con el nuevo usuario creado
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// Método para eliminar un usuario por su ID
const deleteUser = async (req, res) => {
    const { id } = req.params; // Obtener el ID del usuario
    
    try {
        // Buscar y eliminar el usuario por su ID
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
};

module.exports = {
    registerUser,
    deleteUser,
};
