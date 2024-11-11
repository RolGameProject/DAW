const request = require('supertest');
const { Enemy, ENEMY_TYPES } = require('../server/models/enemyModel');
const app = require('../server/index');
const { connect, closeDatabase, clearDatabase } = require('./mongoSetup');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  jest.setTimeout(10000);
  await closeDatabase();
});

describe('Pruebas de enemigos', () => {
  it('Debería crear un enemigo válido', async () => {
    const response = await request(app)
      .post('/api/enemies')
      .send({
        name: 'Goblin',
        type: 'Bestia',
        health: 50,
        abilities: [
            { name: 'Fuerza', value: 80, enabled: true },
            { name: 'Agilidad', value: 60, enabled: true },
            { name: 'Inteligencia', value: 2, enabled: true },
            { name: 'Carisma', value: -5, enabled: true },
            { name: 'Sabiduría', value: -50, enabled: true },
            { name: 'Constitución', value: 100, enabled: true }
          ],
        effects: [
          { name: 'Veneno', duration: 5, potency: 2 }
        ],
        interactionRequired: true,
        createdBy: '644abc123def456789abcdef'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.enemy.name).toBe('Goblin');
    expect(response.body.enemy.type).toBe('Bestia');
    expect(response.body.enemy.health).toBe(50);
  });

  it('Debería rechazar la creación de un enemigo con tipo no válido', async () => {
    const response = await request(app)
      .post('/api/enemies')
      .send({
        name: 'Orco',
        type: 'Alienígena', // Tipo no válido
        health: 80,
        abilities: [
            { name: 'Fuerza', value: 80, enabled: true },
            { name: 'Agilidad', value: 60, enabled: true },
            { name: 'Inteligencia', value: 2, enabled: true },
            { name: 'Carisma', value: -5, enabled: true },
            { name: 'Sabiduría', value: -50, enabled: true },
            { name: 'Constitución', value: 100, enabled: true }
          ],
        effects: [
            { name: 'Veneno', duration: 5, potency: 2 }
          ],
        createdBy: '644abc123def456789abcdef'
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toContain('Error al crear enemigo');
  });

  it('Debería rechazar la creación de un enemigo con salud negativa', async () => {
    const response = await request(app)
      .post('/api/enemies')
      .send({
        name: 'Espectro',
        type: 'Demonio',
        health: -10, // Salud negativa
        abilities: [
            { name: 'Fuerza', value: 80, enabled: true },
            { name: 'Agilidad', value: 60, enabled: true },
            { name: 'Inteligencia', value: 2, enabled: true },
            { name: 'Carisma', value: -5, enabled: true },
            { name: 'Sabiduría', value: -50, enabled: true },
            { name: 'Constitución', value: 100, enabled: true }
          ],
        effects: [
            { name: 'Veneno', duration: 5, potency: 2 }
          ],
        createdBy: '644abc123def456789abcdef'
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Error al crear enemigo');
  });

  it('Debería obtener todos los enemigos', async () => {
    await Enemy.create({
      name: 'Goblin',
      type: 'Bestia',
      health: 50,
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true },
        { name: 'Inteligencia', value: 2, enabled: true },
        { name: 'Carisma', value: -5, enabled: true },
        { name: 'Sabiduría', value: -50, enabled: true },
        { name: 'Constitución', value: 100, enabled: true }
      ],
      effects: [
        { name: 'Veneno', duration: 5, potency: 2 }
      ],
      createdBy: '644abc123def456789abcdef'
    });

    await Enemy.create({
      name: 'Orco',
      type: 'Bestia',
      health: 80,
      abilities: [
        { name: 'Fuerza', value: 70, enabled: true },
        { name: 'Agilidad', value: 50, enabled: true },
        { name: 'Inteligencia', value: 20, enabled: true },
        { name: 'Carisma', value: -50, enabled: true },
        { name: 'Sabiduría', value: -10, enabled: true },
        { name: 'Constitución', value: 80, enabled: true }
      ],
      effects: [
        { name: 'Veneno', duration: 5, potency: 2 }
      ],
      createdBy: '644abc123def456789abcdef'
    });

    const response = await request(app).get('/api/enemies');
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  it('Debería obtener un enemigo por ID', async () => {
    const enemy = await Enemy.create({
      name: 'Espectro',
      type: 'Demonio',
      health: 100,
      abilities: [
        { name: 'Fuerza', value: 70, enabled: true },
        { name: 'Agilidad', value: 50, enabled: true },
        { name: 'Inteligencia', value: 20, enabled: true },
        { name: 'Carisma', value: -50, enabled: true },
        { name: 'Sabiduría', value: -10, enabled: true },
        { name: 'Constitución', value: 80, enabled: true }
      ],
      effects: [
        { name: 'Veneno', duration: 5, potency: 2 }
      ],
      createdBy: '644abc123def456789abcdef'
    });

    const response = await request(app).get(`/api/enemies/${enemy._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Espectro');
  });

  it('Debería eliminar un enemigo por ID', async () => {
    const enemy = await Enemy.create({
      name: 'Orco',
      type: 'Zombie',
      health: 60,
      abilities: [
        { name: 'Fuerza', value: 70, enabled: true },
        { name: 'Agilidad', value: 50, enabled: true },
        { name: 'Inteligencia', value: 20, enabled: true },
        { name: 'Carisma', value: -50, enabled: true },
        { name: 'Sabiduría', value: -10, enabled: true },
        { name: 'Constitución', value: 80, enabled: true }
      ],
      effects: [
        { name: 'Veneno', duration: 5, potency: 2 }
      ],
      createdBy: '644abc123def456789abcdef'
    });

    const response = await request(app).delete(`/api/enemies/${enemy._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Enemigo eliminado exitosamente');
  });
});
