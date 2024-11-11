// Simulación de dados

// Función para tirar un dado con un número de caras específico
// Recibe el número de caras del dado y devuelve un número aleatorio entre 1 y el número de caras
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

module.exports = { rollDice };
