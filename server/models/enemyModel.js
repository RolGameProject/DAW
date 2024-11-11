// Modelo de Enemigos 
const mongoose = require('mongoose');
const { abilitySchema } = require('../schemas/abilitiesSchema'); 
const { effectSchema } = require('../schemas/effectsSchema'); 

// Lista de tipos posibles para los enemigos
const ENEMY_TYPES = ['Bestia', 'Zombie', 'Humano', 'Demonio', 'Constructor', 'Elemental'];

// Definimos el esquema para los enemigos
const enemySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
    },
    type: {
        type: String,
        enum: ENEMY_TYPES, // El tipo de enemigo debe ser uno de los tipos definidos en ENEMY_TYPES
        required: true, 
    },
    health: {
        type: Number,
        required: true, 
        min: 0, // La salud no puede ser menor a 0
    },
    // Array que contiene las habilidades del enemigo
    abilities: [abilitySchema], // Usamos el esquema de habilidades importado
    // Array que contiene los efectos aplicados al enemigo
    effects: [effectSchema], // Usamos el esquema de efectos importado
    interactionRequired: {
        type: Boolean,
        default: true, // Por defecto, se asume que se requiere interacción con el enemigo
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al usuario que crea el enemigo
        required: true, 
    },
});

// Creamos el modelo de Enemigo basado en el esquema definido
const Enemy = mongoose.model('Enemy', enemySchema);

module.exports = {
    Enemy, // Exportamos el modelo Enemy para su uso en otras partes de la aplicación
    ENEMY_TYPES, // Exportamos los tipos de enemigos disponibles
};
