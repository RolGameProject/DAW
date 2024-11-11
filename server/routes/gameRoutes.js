// Rutas del juego

const express = require('express');
const {
    ensureAuthenticated,
    createGame,
    joinGame,
    saveGameStateAtTurnEnd,
    endGame,
    finishTurn
} = require('../controllers/gameController'); 

const router = express.Router();

// Ruta para crear una nueva partida
router.post('/create', ensureAuthenticated, createGame); 

// Ruta para unirse a una partida existente
router.post('/join', ensureAuthenticated, joinGame); 

// Ruta para guardar el estado del juego al final del turno
router.post('/saveGameStateAtTurnEnd', ensureAuthenticated, saveGameStateAtTurnEnd); 

// Ruta para finalizar una partida
router.post('/endGame', ensureAuthenticated, endGame); 

// Ruta para finalizar el turno de un jugador o del máster
router.post('/finishTurn', ensureAuthenticated, finishTurn); 

module.exports = router; 
