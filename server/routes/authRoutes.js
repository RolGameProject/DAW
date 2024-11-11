// Rutas de autenticación

const express = require('express');
const passport = require('passport');
const { registerUser, deleteUser } = require('../controllers/userController');
const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', registerUser);

// Ruta para eliminar un usuario
router.delete('/delete/:id', deleteUser); // Aseguramos que el ID del usuario se pase como parámetro en la URL

// Ruta para iniciar sesión con Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'], // Solicitamos acceso al perfil y correo electrónico del usuario
}));

// Ruta de callback de Google después de la autenticación
router.get('/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/api/auth/success', // Redirige al éxito si la autenticación es exitosa
        failureRedirect: '/api/auth/failure'  // Redirige al fallo si la autenticación falla
    })
);

// Ruta de éxito de la autenticación
router.get('/success', (req, res) => {
    res.status(200).json({ message: 'Inicio de sesión exitoso', user: req.user }); // Respuesta exitosa con los datos del usuario
});

// Ruta de fallo de la autenticación
router.get('/failure', (req, res) => {
    res.status(401).json({ message: 'Fallo en la autenticación' }); // Respuesta con error si la autenticación falla
});

module.exports = router;
