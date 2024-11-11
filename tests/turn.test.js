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

// Función auxiliar para registrar y autenticar un usuario
const registerAndAuthenticateUser = async (userData) => {
    const registerResponse = await request(app).post('/api/auth/register').send(userData);
    const userId = registerResponse.body._id;

    await request(app).get('/api/auth/google/callback').set('Authorization', 'Bearer someMockToken');
    return { ...registerResponse.body, _id: userId };
};

describe('Pruebas de gestión de turnos', () => {
    let gameMaster;
    let player;
    let gameId;

    beforeEach(async () => {
        gameMaster = await registerAndAuthenticateUser({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });

        player = await registerAndAuthenticateUser({
            displayName: 'Jugador',
            email: 'jugador@correo.com',
            googleId: 'mock-google-id-player'
        });

        const gameResponse = await request(app).post('/api/games/create').send({
            gameName: 'Partida de prueba de turnos',
            gameMaster: gameMaster._id,
        });
        
        gameId = gameResponse.body.gameId;

        await request(app).post('/api/games/join').send({
            gameId: gameId,
            playerId: player._id,
        });
    });

    test('Debería iniciar el primer turno de la partida', async () => {
        const response = await request(app).post('/api/turns/initialize').send({
            gameId: gameId
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Orden de turnos inicializado');
        expect(response.body.turn.currentTurnIndex).toBe(1);
    });

    test('Debería avanzar al siguiente turno', async () => {
        // Primero iniciar el turno
        await request(app).post('/api/turns/initialize').send({ gameId: gameId });

        // Luego avanzar al siguiente turno
        const response = await request(app).post(`/api/turns/next/${gameId}`).send();

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Turno avanzado');
        expect(response.body.turn.currentTurnIndex).toBe(2); 
    });

    test('Debería finalizar el turno de un jugador y esperar al siguiente', async () => {
        // Primero iniciar el turno
        await request(app).post('/api/turns/initialize').send({ gameId: gameId });

        // Finalizar el turno del jugador
        const response = await request(app).post('/api/turns/end').send({
            gameId: gameId,
            playerId: player._id
        });
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Turno finalizado');
        expect(response.body.turn.finishedPlayers).toContain(player._id.toString()); 
    });

    test('Debería finalizar todos los turnos y reiniciar la ronda', async () => {
        // Iniciar el primer turno y agregar jugadores a la lista de finalización de turno
        await request(app).post('/api/turns/initialize').send({ gameId: gameId });
        
        // Finalizar el turno del jugador
        await request(app).post('/api/turns/end').send({
            gameId: gameId,
            playerId: player._id
        });

        // Finalizar el turno del Game Master para completar la ronda
        const response = await request(app).post('/api/turns/end').send({
            gameId: gameId,
            playerId: gameMaster._id
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Ronda completada y turno reiniciado');
        expect(response.body.turn.finishedPlayers).toHaveLength(0); // La lista de jugadores finalizados se reinicia
        expect(response.body.turn.currentTurnIndex).toBe(2); // Se inicia la siguiente ronda
    });
});
