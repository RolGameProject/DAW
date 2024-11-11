// Modelo de Juego
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definimos el esquema para el juego
const gameSchema = new Schema({
    gameName: { 
        type: String, 
        required: true, 
    },
    gameMaster: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Referencia al usuario que es el máster del juego
        required: true, 
    },
    players: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Referencia a los jugadores del juego
    }],
    status: { 
        type: String, 
        enum: ['active', 'ended'], // El estado del juego puede ser 'active' o 'ended'
        default: 'active', // Por defecto, el juego está en estado 'active'
    },
    gameState: { 
        type: Object, 
        default: {}, // Objeto que almacena el estado actual del juego
    },
    currentTurn: { 
        type: Number, 
        default: 1, // El primer turno comienza en 1
    },
    finishedPlayers: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Referencia a los jugadores que han terminado su turno
    }],
    createdAt: { 
        type: Date, 
        default: Date.now, // La fecha de creación del juego es la fecha actual por defecto
    },
    updatedAt: { 
        type: Date, 
        default: Date.now, // La fecha de la última actualización es la fecha actual por defecto
    },
    discordChannelId: { // Agregar el ID del canal de Discord
        type: String, 
        required: false, // Es opcional, solo se llena cuando se crea un canal
    },
    discordInviteLink: { // Agregar el enlace de invitación
        type: String, 
        required: false, // Es opcional, solo se llena cuando se genera un enlace de invitación
    },
});

// Middleware para actualizar el campo 'updatedAt' antes de guardar el documento
gameSchema.pre('save', function (next) {
    this.updatedAt = Date.now(); // Actualiza la fecha de actualización
    next(); // Llama a la siguiente función en la cadena de middleware
});

module.exports = mongoose.model('Game', gameSchema);
