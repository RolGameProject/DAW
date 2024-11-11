// Pruebas autenticación

const request = require('supertest');
const app = require('../server/index');
const User = require('../server/models/userModel');
const { connect, closeDatabase, clearDatabase } = require('./mongoSetup');
const crypto = require('crypto'); 

// Función para generar el hash SHA256
const createSHA256Hash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

beforeAll(async () => {
    await connect(); // Prepara el MongoDB Memory Server
});

afterEach(async () => {
    await clearDatabase(); // Limpia la base de datos
});

afterAll(async () => {
    jest.setTimeout(10000);
    await closeDatabase(); // Cierra la conexión y para el servidor de memoria
});

describe('Pruebas de autenticación', () => {
    beforeEach(async () => {
        await clearDatabase(); // Limpia la base de datos antes de cada prueba
    });

    test('Debería crear un nuevo usuario', async () => {
        const displayName = 'testuser';
        const email = 'testuser@example.com';
        const googleId = '1234567890';

        // Hash de los datos
        const hashedDisplayName = createSHA256Hash(displayName);
        const hashedEmail = createSHA256Hash(email);
        const hashedGoogleId = createSHA256Hash(googleId);

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                displayName,
                email,
                googleId,
            });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('displayName', hashedDisplayName);
        expect(response.body).toHaveProperty('email', hashedEmail);
        expect(response.body).toHaveProperty('googleId', hashedGoogleId);
    });

    test('No debería permitir el registro de un usuario duplicado', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'testuser',
                email: 'testuser@example.com',
                googleId: '1234567890',
            });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'anotheruser',
                email: 'testuser@example.com', // Duplicado
                googleId: '0987654321',
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Usuario ya registrado');
    });

    test('Debería eliminar un usuario', async () => {
        const user = await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'testuser',
                email: 'testuser@example.com',
                googleId: '1234567890',
            });

        const response = await request(app)
            .delete(`/api/auth/delete/${user.body._id}`); // Usa el ID del usuario creado

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Usuario eliminado exitosamente');
        
        // Asegurar de que el usuario ya no esté en la base de datos
        const deletedUser = await User.findById(user.body._id);
        expect(deletedUser).toBeNull();
    });

    test('No debería eliminar un usuario no existente', async () => {
        const response = await request(app)
            .delete('/api/auth/delete/609b9e2e91d4d3e6f4e9d2e5'); // ID de un usuario que no existe

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Usuario no encontrado');
    });
});
