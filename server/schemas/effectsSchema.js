//Esquema de efectos
const mongoose = require('mongoose');

// Lista de efectos
const EFFECT_NAMES = ['Veneno', 'Paralización', 'Quemado', 'Sangrado'];

const effectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: EFFECT_NAMES, // Restringe a los nombres de efectos permitidos
    },
    duration: {
        type: Number,
        required: true, 
        min: 1,
    },
    potency: {
        type: Number,
        required: true, 
        min: 0,
    },
});

module.exports = {
    effectSchema,
    EFFECT_NAMES,
};