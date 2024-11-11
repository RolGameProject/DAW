module.exports = (req, res, next) => {
    // Simula la autenticación al establecer un usuario en el request
    req.user = { _id: 'mockUserId' }; 
    next();
};
