//Esquema de habilidades
const mongoose = require('mongoose');

// Lista de habilidades
const ABILITY_NAMES = ['Fuerza', 'Agilidad', 'Inteligencia', 'Carisma', 'Sabiduría', 'Constitución'];

const abilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ABILITY_NAMES, // Restringe a las habilidades de la lista
    },
    value: {
        type: Number,
        min: -50,
        max: 100,
        default: 0,
    },
    enabled: {
        type: Boolean,
        default: true, // Habilitada por defecto
    },
});

module.exports = {
    abilitySchema,
    ABILITY_NAMES,
};