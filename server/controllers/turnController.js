
const Turn = require('../models/turnModel'); 
const Game = require('../models/gameModel'); 

// Función auxiliar que verifica si todos los jugadores y el máster han terminado el turno
const areAllPlayersFinished = (turn, game) => 
    turn.finishedPlayers.length === (game.players.length + 1); // +1 porque también cuenta al máster

// Inicializa el orden de turnos cuando se crea una nueva partida
const initializeTurnOrder = async (req, res) => {
    const { gameId } = req.body; // Obtener el ID de la partida

    try {
        // Buscar la partida en la base de datos por su ID
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' }); // Si no existe, devuelve 404
        }

        const newTurn = new Turn({
            gameId,
            currentTurnIndex: 1, // Empezar el turno en el índice 1
            finishedPlayers: [] // Inicialmente, nadie ha terminado su turno
        });

        await newTurn.save(); // Guardar el nuevo turno en la base de datos
        res.status(200).json({ message: 'Orden de turnos inicializado', turn: newTurn });
    } catch (error) {
        // Manejo de errores en caso de fallo durante la inicialización
        res.status(500).json({ message: 'Error al inicializar el orden de turnos', error: error.message });
    }
};

// Avanza al siguiente turno en la partida
const nextTurn = async (req, res) => {
    const { gameId } = req.params; // Obtener el ID de la partida
    
    try {
        // Buscar el Turn asociado a la partida
        const turn = await Turn.findOne({ gameId });
        if (!turn) {
            return res.status(404).json({ message: 'Turno no encontrado' }); // Si no existe, devolver 404
        }

        // Buscar la partida para asegurarse de que sigue existiendo
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        // Incrementar el índice del turno y resetear la lista de jugadores que han terminado
        turn.currentTurnIndex += 1;
        turn.finishedPlayers = [];
        await turn.save(); // Guardar los cambios

        res.status(200).json({ message: 'Turno avanzado', turn: turn }); // Responder con el nuevo turno
    } catch (error) {
        res.status(500).json({ message: 'Error al avanzar al siguiente turno', error: error.message });
    }
};

// Permite a un jugador o al máster finalizar su turno
const endTurn = async (req, res) => {
    const { gameId, playerId } = req.body; // Obtener el ID de la partida y el ID del jugador

    try {
        // Buscar el turno actual para la partida
        const turn = await Turn.findOne({ gameId });
        if (!turn) {
            return res.status(404).json({ message: 'Turno no encontrado' }); // Si no existe, devolver 404
        }

        // Verificar que la partida aún existe
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        // Verificar si el jugador ya ha finalizado su turno
        if (turn.finishedPlayers.includes(playerId)) {
            return res.status(400).json({ message: 'Ya has finalizado tu turno.' });
        }

        // Añadir al jugador a la lista de finalización de turno
        turn.finishedPlayers.push(playerId);

        // Comprobar si todos los jugadores y el máster han terminado su turno
        if (areAllPlayersFinished(turn, game)) {
            turn.finishedPlayers = []; // Reiniciar la lista de jugadores que han terminado
            turn.currentTurnIndex += 1; // Avanzar al siguiente turno
            return res.status(200).json({ message: 'Ronda completada y turno reiniciado', turn: turn });
        }

        await turn.save(); // Guardar los cambios si la ronda no ha terminado
        res.status(200).json({ message: 'Turno finalizado', turn: turn });
    } catch (error) {
        res.status(500).json({ message: 'Error al finalizar el turno', error: error.message });
    }
};

module.exports = {
    initializeTurnOrder,
    nextTurn,
    endTurn,
};
