const Game = require('../models/gameModel'); // Importamos el modelo Game para gestionar las partidas
const User = require('../models/userModel'); // Importamos el modelo User para verificar usuarios
const discordClient = require('../discordClient'); // Importamos el cliente de Discord


// Middleware de autenticación
const ensureAuthenticated = (req, res, next) => {
    // En modo de prueba, omitimos la verificación de autenticación
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    // Si el usuario está autenticado, permitimos el acceso
    if (req.isAuthenticated()) {
        return next();
    }
    // Si no está autenticado, devolvemos un error 401 (no autorizado)
    res.status(401).json({ message: 'No autorizado. Por favor, inicia sesión.' });
};

// Crear una nueva partida
const createGame = async (req, res) => {
    try {

        // Extraemos el nombre de la partida y el gameMaster del cuerpo de la petición
        const { gameName, gameMaster } = req.body;

        // Verificamos si el gameMaster existe en la base de datos
        const masterExists = await User.findById(gameMaster);
        if (!masterExists) {
            // Si no encontramos al gameMaster, devolvemos un error 404
            return res.status(404).json({ message: 'Game Master no encontrado' });
        }

        // Creamos un nuevo objeto Game con los datos proporcionados
        const newGame = await Game.create({ gameName, gameMaster });

        // Crear un canal en Discord para la nueva partida
        const channel = await discordClient.createGameChannel(newGame._id.toString(), gameName);

        // Asociar el canal de Discord al juego
        newGame.discordChannelId = channel.id;

        // Guardamos la información del canal de Discord en la base de datos
        await newGame.save();

        // Devolvemos el ID y los datos básicos de la partida creada
        res.status(201).json({
            gameId: newGame._id.toString(),
            gameName: newGame.gameName,
            gameMaster: newGame.gameMaster,
            discordChannelId: newGame.discordChannelId, 
        });
    } catch (error) {
        // Si ocurre algún error, respondemos con un código 500
        res.status(500).json({ message: 'Error al crear la partida', error: error.message });
    }
};

// Unirse a una partida existente
const joinGame = async (req, res) => {
    try {
        // Extraemos el ID de la partida y el ID del jugador del cuerpo de la petición
        const { gameId, playerId } = req.body;

        // Verificamos si el jugador existe en la base de datos
        const playerExists = await User.findById(playerId);
        if (!playerExists) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        // Buscamos la partida por su ID
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        // Verificamos si la partida está activa
        if (game.status !== 'active') {
            return res.status(400).json({ message: 'La partida no está activa.' });
        }

        // Si el jugador no está ya en la lista, lo añadimos
        if (!game.players.includes(playerId)) {
            game.players.push(playerId);
            await game.save(); // Guardamos los cambios en la base de datos
        }

        // Crear la invitación para el canal de Discord de la partida
        const invite = await discordClient.createGameInvite(game.discordChannelId); // Usamos el ID del canal para crear la invitación

        // Devolvemos la información de la partida actualizada
        res.status(200).json({
            game,
            invitationLink: invite.url, //Incluimos el enlace de la invitación
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al unirse a la partida', error: error.message });
    }
};

// Finalizar el turno de un jugador o del máster
const finishTurn = async (req, res) => {
    try {
        const { gameId, playerId } = req.body; // Extraemos el ID de la partida y del jugador
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        if (game.status !== 'active') {
            return res.status(400).json({ message: 'La partida no está activa.' });
        }

        // Verificamos si el jugador ya ha finalizado su turno
        if (game.finishedPlayers.includes(playerId)) {
            return res.status(400).json({ message: 'Ya finalizaste tu turno.' });
        }

        // Añadimos el jugador a la lista de jugadores que han finalizado su turno
        game.finishedPlayers.push(playerId);

        // Comprobamos si todos los jugadores han terminado su turno
        const allPlayersFinished = game.finishedPlayers.length === (game.players.length + 1);

        if (allPlayersFinished) {
            // Si todos han terminado, reiniciamos la lista y avanzamos al siguiente turno
            game.finishedPlayers = [];
            game.currentTurn += 1;

            // Guardamos el estado del juego al finalizar el turno
            await game.save();
            return res.status(200).json({ message: 'El turno ha finalizado y el juego ha sido guardado.', game });
        }

        // Si no han terminado todos, solo guardamos el progreso actual
        await game.save();
        res.status(200).json({ message: 'Has finalizado tu turno.', game });
    } catch (error) {
        res.status(500).json({ message: 'Error al finalizar el turno', error: error.message });
    }
};

// Guardar el estado del juego al final del turno
const saveGameStateAtTurnEnd = async (req, res) => {
    try {
        const { gameId, gameState } = req.body; // Extraemos el ID del juego y el estado actual
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        if (game.status !== 'active') {
            return res.status(400).json({ message: 'La partida no está activa.' });
        }

        // Actualizamos el estado del juego y guardamos los cambios
        game.gameState = gameState;
        await game.save();

        res.status(200).json({ message: 'Estado del juego guardado al final del turno.', game });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar el estado del juego', error: error.message });
    }
};

// Terminar la partida
const endGame = async (req, res) => {
    try {
        const { gameId } = req.body; // Extraemos el ID de la partida
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Partida no encontrada' });
        }

        if (game.status !== 'active') {
            return res.status(400).json({ message: 'La partida ya está terminada.' });
        }

        // Cambiamos el estado de la partida a 'ended' y guardamos los cambios
        game.status = 'ended';
        await game.save();

        res.status(200).json({ message: 'La partida ha sido terminada.', game });
    } catch (error) {
        res.status(500).json({ message: 'Error al terminar la partida', error: error.message });
    }
};

module.exports = {
    ensureAuthenticated,
    createGame,
    joinGame,
    finishTurn,
    saveGameStateAtTurnEnd,
    endGame,
};
