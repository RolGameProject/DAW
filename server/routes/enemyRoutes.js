// Rutas de enemigos

const express = require('express');
const {
    createEnemy,
    getAllEnemies,
    getEnemyById,
    updateEnemy,
    deleteEnemy,
} = require('../controllers/enemyController');

const router = express.Router();

// Rutas para los enemigos
router.post('/', createEnemy); // Crear enemigo
router.get('/', getAllEnemies); // Obtener todos los enemigos
router.get('/:id', getEnemyById); // Obtener enemigo por ID
router.put('/:id', updateEnemy); // Actualizar enemigo
router.delete('/:id', deleteEnemy); // Eliminar enemigo

module.exports = router;
