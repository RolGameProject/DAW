const request = require('supertest');
const { Character, ABILITY_NAMES, CLASS_NAMES } = require('../server/models/characterModel');
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

describe('Pruebas de personajes', () => {
  it('Debería crear un personaje válido', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Thorin',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 80, enabled: true },
          { name: 'Agilidad', value: 60, enabled: true },
          { name: 'Inteligencia', value: 2, enabled: true },
          { name: 'Carisma', value: -5, enabled: true },
          { name: 'Sabiduría', value: -50, enabled: true },
          { name: 'Constitución', value: 100, enabled: true }
        ],
        health: 100
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Thorin');
    expect(response.body.health).toBe(100);
    expect(response.body.abilities).toHaveLength(ABILITY_NAMES.length);
    expect(CLASS_NAMES.includes(response.body.classType)).toBeTruthy();
  });

  it('Debería rechazar la creación de un personaje con una clase no válida', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Bilbo',
        classType: 'Pirata',
        abilities: [
          { name: 'Fuerza', value: 50, enabled: true },
          { name: 'Agilidad', value: 40, enabled: true },
          { name: 'Inteligencia', value: 2, enabled: true },
          { name: 'Carisma', value: -5, enabled: true },
          { name: 'Sabiduría', value: -50, enabled: true },
          { name: 'Constitución', value: 100, enabled: true }
        ],
        health: 50
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(`La clase debe ser una de las siguientes: ${CLASS_NAMES.join(', ')}.`);
  });

  it('Debería rechazar la creación de un personaje con habilidades faltantes', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Bilbo',
        classType: 'Enano',
        abilities: [
          { name: 'Fuerza', value: 70, enabled: true },
        ],
        health: 50
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Se deben proporcionar todas las habilidades.");
  });

  it('Debería rechazar la creación de un personaje con una habilidad no válida', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Legolas',
        classType: 'Arquero',
        abilities: [
          { name: 'Fuerza', value: 70, enabled: true },
          { name: 'Invisibilidad', value: 100 }, // Habilidad no válida
          { name: 'Inteligencia', value: 2, enabled: true },
          { name: 'Carisma', value: -5, enabled: true },
          { name: 'Sabiduría', value: -50, enabled: true },
          { name: 'Constitución', value: 100, enabled: true }
        ],
        health: 75
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain(`La clase debe ser una de las siguientes: ${CLASS_NAMES.join(', ')}.`);
  });

  it('Debería rechazar la creación de un personaje con habilidades fuera de rango', async () => {

    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Thorin el Indomable',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 50, enabled: true },
          { name: 'Agilidad', value: 40, enabled: true },
          { name: 'Inteligencia', value: 2, enabled: true },
          { name: 'Carisma', value: -5, enabled: true },
          { name: 'Sabiduría', value: -50, enabled: true },
          { name: 'Constitución', value: 110, enabled: true }
        ],
        health: 100
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("El valor de las habilidades debe estar entre -50 y 100.");
  });

  it('Debería rechazar la creación de un personaje con salud fuera de rango', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Gimli',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 80, enabled: true },
          { name: 'Agilidad', value: 90 },
          { name: 'Inteligencia', value: 2, enabled: true },
          { name: 'Carisma', value: -5, enabled: true },
          { name: 'Sabiduría', value: -50, enabled: true },
          { name: 'Constitución', value: 100, enabled: true }
        ],
        health: 120 // Salud fuera de rango
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("La salud debe estar entre 0 y 100.");
  });

  it('Debería obtener todos los personajes', async () => {
    await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true },
        { name: 'Inteligencia', value: 2, enabled: true },
        { name: 'Carisma', value: -5, enabled: true },
        { name: 'Sabiduría', value: -50, enabled: true },
        { name: 'Constitución', value: 100, enabled: true }
      ],
      health: 100
    });

    await Character.create({
      name: 'Gimli',
      classType: 'Enano',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true },
        { name: 'Inteligencia', value: 2, enabled: true },
        { name: 'Carisma', value: -5, enabled: true },
        { name: 'Sabiduría', value: -50, enabled: true },
        { name: 'Constitución', value: 100, enabled: true }
      ],
      health: 100
    });

    const response = await request(app).get('/api/characters');

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  it('Debería obtener un personaje por ID', async () => {
    const character = await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true },
        { name: 'Inteligencia', value: 2, enabled: true },
        { name: 'Carisma', value: -5, enabled: true },
        { name: 'Sabiduría', value: -50, enabled: true },
        { name: 'Constitución', value: 100, enabled: true }
      ],
      health: 100
    });

    const response = await request(app).get(`/api/characters/${character._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Thorin');
    expect(response.body.abilities).toHaveLength(ABILITY_NAMES.length);
  });

  it('Debería actualizar un personaje existente', async () => {
    const character = await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true },
        { name: 'Inteligencia', value: 2, enabled: true },
        { name: 'Carisma', value: -5, enabled: true },
        { name: 'Sabiduría', value: -50, enabled: true },
        { name: 'Constitución', value: 100, enabled: true }
      ],
      health: 100
    });

    const response = await request(app)
      .put(`/api/characters/${character._id}`)
      .send({
        name: 'Thorin el Indomable',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 60, enabled: true },
          { name: 'Agilidad', value: 10, enabled: true }
        ],
        health: 90 // Salud válida
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Thorin el Indomable');
    expect(response.body.health).toBe(90);
    expect(response.body.abilities).toHaveLength(2);
  });

  it('Debería rechazar la actualización de un personaje con una clase no válida', async () => {
    const character = await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true }
      ],
      health: 100
    });

    const response = await request(app)
      .put(`/api/characters/${character._id}`)
      .send({
        name: 'Thorin el Indomable',
        classType: 'Pirata', // Clase no válida
        abilities: [
          { name: 'Fuerza', value: 90, enabled: true },
          { name: 'Agilidad', value: 70, enabled: true },
        ],
        health: 100
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(`La clase debe ser una de las siguientes: ${CLASS_NAMES.join(', ')}.`);
  });

  it('Debería rechazar la actualización de un personaje con una habilidad no válida', async () => {
    const character = await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true }
      ],
      health: 100
    });

    const response = await request(app)
      .put(`/api/characters/${character._id}`)
      .send({
        name: 'Thorin el Indomable',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 90, enabled: true },
          { name: 'Invisibilidad', value: 50, enabled: true } // Habilidad no válida
        ],
        health: 100
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain(`La habilidad debe ser una de las siguientes: ${ABILITY_NAMES.join(', ')}.`);
  });

  it('Debería rechazar la actualización de un personaje con habilidades fuera de rango', async () => {
    const character = await Character.create({
      name: 'Thorin',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Agilidad', value: 60, enabled: true }
      ],
      health: 100
    });

    const response = await request(app)
      .put(`/api/characters/${character._id}`)
      .send({
        name: 'Thorin el Indomable',
        classType: 'Bárbaro',
        abilities: [
          { name: 'Fuerza', value: 110, enabled: true }, // Fuera de rango
          { name: 'Agilidad', value: 70, enabled: true }
        ],
        health: 100
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("El valor de las habilidades debe estar entre -50 y 100.");
  });

  it('Debería rechazar la actualización de un personaje con salud fuera de rango', async () => {
    const character = await Character.create({
      name: 'Gimli',
      classType: 'Bárbaro',
      abilities: [
        { name: 'Fuerza', value: 80, enabled: true },
        { name: 'Constitución', value: 90, enabled: true }
      ],
      health: 50
    });

    const response = await request(app)
      .put(`/api/characters/${character._id}`)
      .send({
        health: 120 // Salud fuera de rango
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("La salud debe estar entre 0 y 100.");
  });


});
