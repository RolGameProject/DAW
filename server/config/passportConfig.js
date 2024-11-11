// Importamos los módulos necesarios para la configuración de Passport con Google OAuth y hashing de datos
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto'); // Importamos el módulo para crear hashes SHA256
const User = require('../models/userModel'); // Modelo de usuario para interactuar con la base de datos

// Función para generar un hash SHA256 a partir de un dato sensible
// Esta función se utiliza para proteger la información de usuario en la base de datos
const createSHA256Hash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Serialización del usuario para almacenar solo su ID en la sesión

passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialización del usuario utilizando el ID almacenado en la sesión

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id); // Busca el usuario en la base de datos usando su ID
        done(null, user); // Si lo encuentra, lo retorna
    } catch (error) {
        done(error, null); // En caso de error, pasa el error
    }
});

// Configuración de la estrategia de autenticación de Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // ID del cliente de Google, almacenado en variables de entorno
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Secreto del cliente de Google
    callbackURL: '/auth/google/callback', // URL de redirección después de autenticarse en Google
}, async (accessToken, refreshToken, profile, done) => { // Función para manejar el flujo después de autenticarse
    try {
        // Hasheamos los datos sensibles antes de almacenarlos
        const hashedGoogleId = createSHA256Hash(profile.id); // Hash de ID de Google del usuario
        const hashedDisplayName = createSHA256Hash(profile.displayName); // Hash del nombre de usuario
        const hashedEmail = createSHA256Hash(profile.emails[0].value); // Hash del email del usuario

        // Buscamos si el usuario ya existe en la base de datos mediante el googleId hasheado
        const existingUser = await User.findOne({ googleId: hashedGoogleId });
        if (existingUser) {
            return done(null, existingUser); // Si el usuario existe, lo devuelve para iniciar sesión
        }

        // Si el usuario no existe, creamos un nuevo registro en la base de datos con los datos hasheados
        const newUser = await new User({
            googleId: hashedGoogleId,
            displayName: hashedDisplayName,
            email: hashedEmail, // El email también se guarda como un hash
        }).save();

        done(null, newUser); // Devolvemos el nuevo usuario
    } catch (error) {
        done(error, null); // Si hay un error, lo pasamos
    }
}));

// Exportamos la configuración de Passport para usarla en las rutas de autenticación
module.exports = passport;
