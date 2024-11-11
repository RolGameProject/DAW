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

describe('Pruebas de integración completas', () => {
    let gameMaster;
    let player;
    let gameId;
    let characterId;
    let enemyId;
    let characterResponse;
    let enemyResponse;

    beforeEach(async () => {
        // Registrar al máster de la partida
        const registerMaster = await request(app).post('/api/auth/register').send({
            displayName: 'Master',
            email: 'master@correo.com',
            googleId: 'mock-google-id-master'
        });
        gameMaster = registerMaster.body;

        // Registrar al jugador
        const registerPlayer = await request(app).post('/api/auth/register').send({
            displayName: 'Jugador',
            email: 'jugador@correo.com',
            googleId: 'mock-google-id-player'
        });
        player = registerPlayer.body;

        // Crear un personaje para el jugador con todas las habilidades
        characterResponse = await request(app).post('/api/characters').send({ // Corregido la ruta aquí
            name: 'Guerrero',
            classType: 'Bárbaro',
            abilities: [
                { name: 'Fuerza', value: -50, enabled: true },
                { name: 'Agilidad', value: 50, enabled: true },
                { name: 'Inteligencia', value: 30, enabled: true },
                { name: 'Carisma', value: 40, enabled: true },
                { name: 'Sabiduría', value: 20, enabled: true },
                { name: 'Constitución', value: 60, enabled: true }
            ],
            health: 100
        });
        characterId = characterResponse.body._id;

        // Crear la partida
        const gameResponse = await request(app).post('/api/games/create').send({ 
            gameName: 'Partida de prueba completa',
            gameMaster: gameMaster._id,
        });
        gameId = gameResponse.body.gameId;

        // El jugador se une a la partida con su personaje
        await request(app).post('/api/games/join').send({ 
            gameId: gameId,
            playerId: player._id,
            characterId: characterId
        });
    });

    test('Debería permitir crear un enemigo con todas las habilidades y efectos', async () => {
        enemyResponse = await request(app).post('/api/enemies').send({ 
            name: 'Goblin',
            type: 'Bestia',
            health: 50,
            abilities: [
                { name: 'Fuerza', value: 100, enabled: true },
                { name: 'Agilidad', value: 60, enabled: true },
                { name: 'Inteligencia', value: 20, enabled: true },
                { name: 'Carisma', value: 30, enabled: true },
                { name: 'Sabiduría', value: 50, enabled: true },
                { name: 'Constitución', value: 70, enabled: true }
            ],
            effects: [
                { name: 'Veneno', duration: 3, potency: 10 }
            ],
            gameId: gameId,
            createdBy: gameMaster._id
        });
        enemyId = enemyResponse.body._id;

        expect(enemyResponse.status).toBe(201);
        expect(enemyResponse.body.enemy.name).toBe('Goblin');
        expect(enemyResponse.body.enemy.type).toBe('Bestia');
        expect(enemyResponse.body.enemy.abilities).toHaveLength(6); // Verificar que tenga todas las habilidades
        expect(enemyResponse.body.enemy.effects).toHaveLength(1); // Verificar los efectos
    });

    test('Debería permitir la interacción entre un personaje y un enemigo', async () => {
        
        // Iniciar el turno
        await request(app).post('/api/turns/initialize').send({ gameId: gameId }); 

        enemyResponse = await request(app).post('/api/enemies').send({
            name: 'Goblin',
            type: 'Bestia',
            health: 50,
            abilities: [
                { name: 'Fuerza', value: 100, enabled: true },
                { name: 'Agilidad', value: 60, enabled: true },
                { name: 'Inteligencia', value: 20, enabled: true },
                { name: 'Carisma', value: 30, enabled: true },
                { name: 'Sabiduría', value: 50, enabled: true },
                { name: 'Constitución', value: 70, enabled: true }
            ],
            effects: [
                { name: 'Veneno', duration: 3, potency: 10 }
            ],
            gameId: gameId,
            createdBy: gameMaster._id
        });
        
        // Ejecutar la interacción
        const interactionResponse = await request(app).post('/api/interaction/interact').send({ 
            character: characterResponse.body,
            enemy: enemyResponse.body.enemy,
            selectedStat: 'Fuerza', 
            diceType: 20 
        });

        expect(interactionResponse.status).toBe(200);
        const validResults = ['satisfactorio', 'bueno', 'empate', 'malo', 'catastrófico'];
        expect(validResults).toContain(interactionResponse.body.result);
    });

    test('Debería permitir la gestión de turnos de la partida', async () => {
        // Iniciar el turno
        const initializeResponse = await request(app).post('/api/turns/initialize').send({ gameId: gameId });
        expect(initializeResponse.status).toBe(200);
        expect(initializeResponse.body.turn.currentTurnIndex).toBe(1);

        // Avanzar al siguiente turno
        const nextTurnResponse = await request(app).post(`/api/turns/next/${gameId}`).send(); 
        expect(nextTurnResponse.status).toBe(200);
        expect(nextTurnResponse.body.turn.currentTurnIndex).toBe(2);

        // Finalizar el turno del jugador
        const endTurnResponse = await request(app).post('/api/turns/end').send({ 
            gameId: gameId,
            playerId: player._id
        });
        expect(endTurnResponse.status).toBe(200);
        expect(endTurnResponse.body.message).toBe('Turno finalizado');
        expect(endTurnResponse.body.turn.finishedPlayers).toContain(player._id.toString());

        // Finalizar todos los turnos y reiniciar la ronda
        const endRoundResponse = await request(app).post('/api/turns/end').send({ 
            gameId: gameId,
            playerId: gameMaster._id
        });
        expect(endRoundResponse.status).toBe(200);
        expect(endRoundResponse.body.message).toBe('Ronda completada y turno reiniciado');
        expect(endRoundResponse.body.turn.finishedPlayers).toHaveLength(0);
    });

    test('Debería permitir que el máster finalice la partida', async () => {
        // Finalizar el juego
        const endGameResponse = await request(app).post(`/api/games/endGame`).send({ 
            gameId: gameId
        });

        expect(endGameResponse.status).toBe(200);
        expect(endGameResponse.body.message).toBe('La partida ha sido terminada.');
        expect(endGameResponse.body.game.status).toBe('ended');
    });
});
