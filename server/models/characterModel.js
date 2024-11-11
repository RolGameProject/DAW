// Modelo de Personaje 
const mongoose = require('mongoose');
const { abilitySchema, ABILITY_NAMES } = require('../schemas/abilitiesSchema'); 

// Lista de clases disponibles para los personajes
const CLASS_NAMES = ['Bárbaro', 'Elfo', 'Mago', 'Humano', 'Enano'];

// Definimos el esquema para los personajes
const characterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // El nombre es obligatorio
    },
    classType: {
        type: String,
        required: true, // La clase es obligatoria
        enum: CLASS_NAMES, // Solo se permite uno de los valores de la lista CLASS_NAMES
    },
    abilities: {
        type: [abilitySchema], // Usamos el esquema de habilidades importado
        required: true, // Las habilidades son obligatorias
        validate: {
            validator: function(abilities) {
                // Verificamos que cada habilidad se utilice solo una vez
                const uniqueAbilities = new Set(abilities.map(ability => ability.name));
                return uniqueAbilities.size === abilities.length; // Si el tamaño es igual, las habilidades son únicas
            },
            message: 'Cada habilidad debe ser única.', // Mensaje de error si no se cumple la validación
        },
    },
    health: {
        type: Number,
        required: true, // La salud es obligatoria
        min: 0, // La salud no puede ser menor a 0
        max: 100, // La salud no puede ser mayor a 100
        default: 100, // Establecemos el valor por defecto de salud en 100
    },
});

// Método para verificar si el personaje está muerto
characterSchema.methods.isDead = function() {
    return this.health <= 0; // Si la salud es 0 o menos, el personaje está muerto
};

module.exports = {
    Character: mongoose.model('Character', characterSchema), // Exportamos el modelo Character basado en el esquema
    ABILITY_NAMES, // Exportamos las constantes de nombres de habilidades
    CLASS_NAMES, // Exportamos las clases disponibles
};
