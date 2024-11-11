const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connect = async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    if (mongoose.connection.readyState === 0) { 
        await mongoose.connect(uri); 
    }
};

const closeDatabase = async () => {
    await mongoose.connection.dropDatabase(); // Limpia la base de datos después de cada prueba
    await mongoose.connection.close(); // Cierra la conexión
    await mongoServer.stop(); // Detiene el servidor en memoria
};

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({}); 
    }
};

module.exports = {
    connect,
    closeDatabase,
    clearDatabase,
};
