const request = require('supertest');
const app = require('../server/index');
const { connect, closeDatabase, clearDatabase } = require('./mongoSetup');

// Mock del middleware de autenticación
jest.mock('../server/middleware/authMiddleware', () => {
    return (req, res, next) => {
        req.user = { _id: 'mockUserId' }; // Simulando un usuario autenticado
        next();
    };
});

beforeAll(async () => {
    await connect(); // Conectar a MongoDB en memoria
});

afterEach(async () => {
    await clearDatabase(); // Limpiar la base de datos después de cada prueba
});

afterAll(async () => {
    await closeDatabase(); // Cerrar la base de datos al terminar todas las pruebas
});

// Función para registrar y autenticar un usuario
const registerAndAuthenticateUser = async (userData) => {
    const registerResponse = await request(app).post('/api/auth/register').send(userData);
    const userId = registerResponse.body._id;

    await request(app).get('/api/auth/google/callback').set('Authorization', 'Bearer someMockToken');
    return { ...registerResponse.body, _id: userId };
};

describe('Pruebas de partidas', () => {
    test('Debería crear una nueva partida', async () => {
        const gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        const response = await request(app).post('/api/games/create').send({
            gameName: 'PartidaPrueba',
            gameMaster: gameMaster._id,
        });

        expect(response.status).toBe(201);
        expect(response.body.gameName).toBe('PartidaPrueba');
        expect(response.body.gameMaster).toBe(gameMaster._id.toString());
    });

    test('Debería unirse a una partida existente', async () => {
        const gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        const player = await registerAndAuthenticateUser({
            displayName: 'Jugador',
            email: 'jugador@correo.com',
            googleId: 'mock-google-id-player'
        });

        const gameResponse = await request(app).post('/api/games/create').send({
            gameName: 'PartidaPrueba',
            gameMaster: gameMaster._id,
        });
        
        const gameId = gameResponse.body.gameId;

        console.log('Recibiendo solicitud para unirse a la partida:', gameId, player._id)


        const response = await request(app).post('/api/games/join').send({
            gameId: gameId,
            playerId: player._id,
        });

        expect(response.status).toBe(200);
        expect(response.body.game.players).toContain(player._id.toString());
    });

    test('Debería finalizar el turno de un jugador', async () => {
        const gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        const player = await registerAndAuthenticateUser({
            displayName: 'Jugador',
            email: 'jugador@correo.com',
            googleId: 'mock-google-id-player'
        });

        const gameResponse = await request(app).post('/api/games/create').send({
            gameName: 'PartidaPrueba',
            gameMaster: gameMaster._id,
        });
        
        const gameId = gameResponse.body.gameId;

        await request(app).post('/api/games/join').send({
            gameId: gameId,
            playerId: player._id,
        });

        const response = await request(app).post('/api/games/finishTurn').send({
            gameId: gameId,
            playerId: player._id,
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Has finalizado tu turno.');
    });

    test('Debería guardar el estado del juego al finalizar el turno', async () => {
        const gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        const gameResponse = await request(app).post('/api/games/create').send({
            gameName: 'PartidaPrueba',
            gameMaster: gameMaster._id,
        });

        const gameId = gameResponse.body.gameId;

        const response = await request(app).post('/api/games/saveGameStateAtTurnEnd').send({
            gameId: gameId,
            gameState: { someStateKey: 'someStateValue' }
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Estado del juego guardado al final del turno.');
        expect(response.body.game.gameState.someStateKey).toBe('someStateValue');
    });

    test('Debería terminar la partida', async () => {
        const gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        const gameResponse = await request(app).post('/api/games/create').send({
            gameName: 'PartidaPrueba',
            gameMaster: gameMaster._id,
        });

        const gameId = gameResponse.body.gameId;

        const response = await request(app).post('/api/games/endGame').send({ gameId: gameId });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('La partida ha sido terminada.');
        expect(response.body.game.status).toBe('ended');
    });
});
