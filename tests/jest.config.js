module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./mongoSetup.js'], 
  testMatch: ['**./*.test.js'],
  testTimeout: 20000, // Tiempo de espera extendido
};
