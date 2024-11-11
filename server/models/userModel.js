// Modelo de Usuario
const mongoose = require('mongoose');

// Definimos el esquema para el usuario
const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true, // El campo es obligatorio
        unique: true, // Aseguramos que no haya duplicados en el ID de Google
    },
    displayName: {
        type: String, 
        required: true, 
    },
    email: {
        type: String, 
        required: true, 
        unique: true, // Aseguramos que no haya duplicados en los correos electrónicos
    },
});

module.exports = mongoose.model('User', userSchema);
