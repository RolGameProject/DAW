// Rutas de interacción entre personajes y enemigos

const express = require('express');
const router = express.Router();
const { interaction } = require('../controllers/interactionController'); 


router.post('/interact', interaction);

module.exports = router; 
