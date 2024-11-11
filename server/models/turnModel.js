// Modelo de Turno
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definimos el esquema para el turno de un juego
const turnSchema = new Schema({
    gameId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Game', // Referencia al juego al que pertenece el turno
        required: true, 
    },
    currentTurnIndex: { 
        type: Number, 
        default: 1, // El primer turno comienza en 1 por defecto para mayor claridad
    },
    finishedPlayers: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Referencia a los jugadores que han terminado su turno actual
    }],
    createdAt: { 
        type: Date, 
        default: Date.now, // La fecha de creación del turno es la fecha actual por defecto
    },
    updatedAt: { 
        type: Date, 
        default: Date.now, // La fecha de la última actualización es la fecha actual por defecto
    },
});

// Middleware para actualizar el campo 'updatedAt' antes de guardar el documento
turnSchema.pre('save', function (next) {
    this.updatedAt = Date.now(); // Actualiza la fecha de la última actualización
    next(); // Llama a la siguiente función en la cadena de middleware
});

module.exports = mongoose.model('Turn', turnSchema);
