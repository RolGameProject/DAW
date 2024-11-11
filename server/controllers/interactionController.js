
const { rollDice } = require('../utils/diceRoller'); // Importar la función para tirar dados

// Calcula el modificador en base al valor de la habilidad del personaje o enemigo
function calculateModifier(stat) {
    return stat / 10; // El modificador se obtiene dividiendo el valor entre 10
}

//Gestionar la interacción entre un personaje y un enemigo
const interaction = async (req, res) => {
    const { character, enemy, selectedStat, diceType, overrideOutcome } = req.body;

    try {
        // Determina el tipo de dado a utilizar según el parámetro (6, 10 o 20)
        const maxRoll = diceType === 6 ? 6 : diceType === 10 ? 10 : 20;

        // Busca la habilidad seleccionada en el array de habilidades del personaje
        const characterAbility = character.abilities.find(a => a.name === selectedStat);
        // Busca la misma habilidad en el enemigo
        const enemyAbility = enemy.abilities.find(a => a.name === selectedStat);

        // Si el personaje no tiene la habilidad seleccionada, lanza un error
        if (!characterAbility) {
            return res.status(400).json({ error: `Habilidad "${selectedStat}" no encontrada en el personaje` });
        }

        // Si el enemigo no tiene la habilidad seleccionada, lanza un error
        if (!enemyAbility) {
            return res.status(400).json({ error: `Habilidad "${selectedStat}" no encontrada en el enemigo` });
        }

        // Calcula el modificador para el personaje basado en su habilidad
        const characterModifier = calculateModifier(characterAbility.value);
        // Calcula el modificador para el enemigo basado en su habilidad
        const enemyModifier = calculateModifier(enemyAbility.value);

        // Realiza tiradas de dados para el personaje y el enemigo, sumando sus modificadores
        const characterRoll = rollDice(maxRoll) + characterModifier;
        const enemyRoll = rollDice(maxRoll) + enemyModifier;

        // Si se ha proporcionado un resultado forzado, lo utiliza; si no, calcula la diferencia
        const outcome = overrideOutcome !== null ? overrideOutcome : characterRoll - enemyRoll;

        let result, healthImpact; 

        // Clasifica el resultado de la interacción según la diferencia entre las tiradas y modificadores
        if (outcome >= 10) {
            result = 'satisfactorio'; // Éxito grande para el personaje
            healthImpact = -10; // El enemigo recibe daño significativo
        } else if (outcome >= 5) {
            result = 'bueno'; // Éxito moderado para el personaje
            healthImpact = -5; // El enemigo recibe daño menor
        } else if (outcome < 5 && outcome >= 0) {
            result = 'empate'; // No hay ganador
            healthImpact = 0; // Sin impacto en la salud
        } else if (outcome >= -5) {
            result = 'malo'; // Resultado desfavorable para el personaje
            healthImpact = -5; // El personaje recibe daño menor
        } else {
            result = 'catastrófico'; // Fallo enorme para el personaje
            healthImpact = -10; // El personaje recibe daño significativo
        }

        // Aplica el daño a la salud del personaje o del enemigo según el resultado
        if (healthImpact < 0) {
            if (result === 'malo' || result === 'catastrófico') {
                character.health += healthImpact; // Resta salud al personaje
            } else {
                enemy.health += healthImpact; // Resta salud al enemigo
            }
        }

        let inflictedEffect = null;

        // Si el resultado fue 'malo', hay una probabilidad de 50% de aplicar un efecto
        if (result === 'malo' && Math.random() < 0.5) {
            inflictedEffect = enemy.effects[0].name; // Aplica el primer efecto del enemigo
        }
        // Si el resultado fue 'catastrófico', aplica un efecto automáticamente
        else if (result === 'catastrófico') {
            inflictedEffect = enemy.effects[0].name;
        }

        // Devuelve el resultado final de la interacción
        return res.status(200).json({ result, characterRoll, enemyRoll, inflictedEffect, character, enemy });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error durante la interacción' });
    }
}

module.exports = { interaction };