const request = require('supertest');
const app = require('../server/index');
const { connect, closeDatabase, clearDatabase } = require('./mongoSetup');
const { Character } = require('../server/models/characterModel');
const { Enemy } = require('../server/models/enemyModel');

describe('Interaction API', () => {
    let character;
    let enemy;

    beforeAll(async () => {
        await connect(); // Conecta a la base de datos en memoria
    });

    beforeEach(async () => {
        // Configura un personaje y un enemigo con los atributos completos
        character = new Character({
            name: 'Aragorn',
            classType: 'Humano',
            abilities: [
                { name: 'Fuerza', value: 100 },
                { name: 'Agilidad', value: 75 },
                { name: 'Inteligencia', value: 20 },
                { name: 'Carisma', value: 10 },
                { name: 'Sabiduría', value: 0 },
                { name: 'Constitución', value: -10 }
            ],
            health: 100,
        });

        enemy = new Enemy({
            name: 'Goblin',
            type: 'Bestia',
            health: 100,
            abilities: [
                { name: 'Fuerza', value: 50 },
                { name: 'Agilidad', value: 20 },
                { name: 'Inteligencia', value: 15 },
                { name: 'Carisma', value: 5 },
                { name: 'Sabiduría', value: -5 },
                { name: 'Constitución', value: -15 }
            ],
            effects: [
                { name: 'Veneno', duration: 2, potency: 2 }
            ],
            interactionRequired: true,
            createdBy: '507f1f77bcf86cd799439011' // ID de usuario ficticio
        });

        // Guardar el personaje y el enemigo en la base de datos
        await character.save();
        await enemy.save();
    });

    afterEach(async () => {
        await clearDatabase(); // Limpia la base de datos después de cada prueba
    });

    afterAll(async () => {
        await closeDatabase(); // Cierra la conexión a la base de datos
    });

    test('debe devolver "satisfactorio" si el personaje tiene una ventaja significativa', async () => {
        const response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Fuerza',
                diceType: 6,
                overrideOutcome: 11
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('satisfactorio');
        expect(response.body.characterRoll).toBeGreaterThan(response.body.enemyRoll);
        expect(response.body.enemy.health).toBeLessThan(100); // Daño al enemigo
        expect(response.body.inflictedEffect).toBeNull(); // Sin efecto aplicado al personaje
    });

    test('debe devolver "bueno" si el personaje tiene una ligera ventaja', async () => {
        const response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Agilidad',
                diceType: 6,
                overrideOutcome: 6
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('bueno');
        expect(response.body.enemy.health).toBeLessThan(100); // Daño leve al enemigo
        expect(response.body.inflictedEffect).toBeNull(); // Sin efecto aplicado al personaje
    });

    test('debe devolver "empate" si las tiradas son iguales', async () => {

        const response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Inteligencia',
                diceType: 6,
                overrideOutcome: 0
            });

        expect(response.status).toBe( 200);
        expect(response.body.result).toBe('empate');
        expect(response.body.character.health).toBe(100);
        expect(response.body.enemy.health).toBe(100);
        expect(response.body.inflictedEffect).toBeNull();
    });

    test('debe devolver "malo" y aplicar un posible efecto si el enemigo tiene ventaja', async () => {
        const response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Carisma',
                diceType: 6,
                overrideOutcome: -2
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('malo');
        expect(response.body.character.health).toBeLessThan(100); // Daño al personaje
        expect(response.body.enemy.health).toBe(100); // Salud del enemigo sin cambios
        if (response.body.inflictedEffect) {
            expect(response.body.inflictedEffect).toBe('Veneno'); // Efecto aplicado
        }
    });

    test('debe devolver "catastrófico" y aplicar obligatoriamente el efecto del enemigo', async () => {

        const response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Constitución',
                diceType: 6,
                overrideOutcome: -12
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('catastrófico');
        expect(response.body.character.health).toBeLessThan(100); // Daño al personaje
        expect(response.body.inflictedEffect).toBe('Veneno'); // Efecto aplicado
    });

    test('debe funcionar con diferentes tipos de dados (D10 y D20)', async () => {
        let response;

        // Tirada con D10
        response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Fuerza',
                diceType: 10
            });
        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined(); // Verificamos que se devuelve un resultado válido

        // Tirada con D20
        response = await request(app)
            .post('/api/interaction/interact')
            .send({
                character: character,
                enemy: enemy,
                selectedStat: 'Agilidad',
                diceType: 20
            });
        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
    });
});