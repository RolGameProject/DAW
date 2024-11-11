const { Enemy } = require('../models/enemyModel'); // Importamos el modelo Enemy para interactuar con la base de datos

// Crear un nuevo enemigo
const createEnemy = async (req, res) => {
    try {
        // Extraemos los datos necesarios de la petición
        const { name, type, health, abilities, effects, interactionRequired, createdBy } = req.body;
        
        // Creamos un nuevo objeto de enemigo con los datos proporcionados
        const enemy = new Enemy({
            name,
            type,
            health,
            abilities,
            effects,
            interactionRequired,
            createdBy,
        });
        
        // Guardamos el enemigo en la base de datos
        await enemy.save();
        // Devolvemos una respuesta con un mensaje de éxito y el enemigo creado
        res.status(201).json({ message: 'Enemigo creado exitosamente', enemy });
    } catch (error) {
        // Si hay un error, respondemos con un código 500 y el mensaje de error
        res.status(500).json({ message: 'Error al crear enemigo', error: error.message });
    }
};

// Obtener todos los enemigos
const getAllEnemies = async (req, res) => {
    try {
        // Recuperamos todos los enemigos de la base de datos
        const enemies = await Enemy.find();
        // Devolvemos la lista de enemigos con un código 200 (éxito)
        res.status(200).json(enemies);
    } catch (error) {
        // Si ocurre un error al obtener los enemigos, respondemos con un código 500
        res.status(500).json({ message: 'Error al obtener enemigos', error: error.message });
    }
};

// Obtener un enemigo por su ID
const getEnemyById = async (req, res) => {
    try {
        const { id } = req.params; // Extraemos el ID del enemigo desde los parámetros de la URL
        const enemy = await Enemy.findById(id); // Buscamos el enemigo en la base de datos

        // Si el enemigo no existe, respondemos con un error 404 (no encontrado)
        if (!enemy) {
            return res.status(404).json({ message: 'Enemigo no encontrado' });
        }

        // Si lo encontramos, lo devolvemos con un código 200
        res.status(200).json(enemy);
    } catch (error) {
        // Si hay un error en la búsqueda, respondemos con un código 500
        res.status(500).json({ message: 'Error al obtener enemigo', error: error.message });
    }
};

// Actualizar un enemigo por su ID
const updateEnemy = async (req, res) => {
    try {
        const { id } = req.params; // Extraemos el ID del enemigo a actualizar
        const { name, type, health, abilities, effects, interactionRequired } = req.body; // Extraemos los datos del cuerpo de la petición

        // Creamos un objeto con los datos actualizados, solo si fueron proporcionados
        const updatedData = {
            name,
            type,
            health,
            abilities,
            effects,
            interactionRequired,
        };

        // Actualizamos el enemigo en la base de datos y devolvemos el nuevo documento
        const enemy = await Enemy.findByIdAndUpdate(id, updatedData, { new: true });

        // Si no se encuentra el enemigo, respondemos con un error 404
        if (!enemy) {
            return res.status(404).json({ message: 'Enemigo no encontrado' });
        }

        // Si se actualiza correctamente, enviamos un mensaje de éxito
        res.status(200).json({ message: 'Enemigo actualizado exitosamente', enemy });
    } catch (error) {
        // Si hay un error en la actualización, respondemos con un código 500
        res.status(500).json({ message: 'Error al actualizar enemigo', error: error.message });
    }
};

// Eliminar un enemigo por su ID
const deleteEnemy = async (req, res) => {
    try {
        const { id } = req.params; // Extraemos el ID del enemigo a eliminar
        const enemy = await Enemy.findByIdAndDelete(id); // Eliminamos el enemigo de la base de datos

        // Si no se encuentra el enemigo, respondemos con un error 404
        if (!enemy) {
            return res.status(404).json({ message: 'Enemigo no encontrado' });
        }

        // Si se elimina correctamente, enviamos un mensaje de éxito
        res.status(200).json({ message: 'Enemigo eliminado exitosamente' });
    } catch (error) {
        // Si hay un error al eliminar, respondemos con un código 500
        res.status(500).json({ message: 'Error al eliminar enemigo', error: error.message });
    }
};

module.exports = {
    createEnemy,
    getAllEnemies,
    getEnemyById,
    updateEnemy,
    deleteEnemy,
};
