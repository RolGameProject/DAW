// Rutas para la gestión de turnos

const express = require('express');
const router = express.Router();
const { initializeTurnOrder, nextTurn, endTurn } = require('../controllers/turnController'); 

// Ruta para inicializar el orden de los turnos al inicio del juego
router.post('/initialize', initializeTurnOrder); 

// Ruta para avanzar al siguiente turno
router.post('/next/:gameId', nextTurn); 

// Ruta para finalizar el turno del máster o del jugador actual
router.post('/end', endTurn); 

module.exports = router;
