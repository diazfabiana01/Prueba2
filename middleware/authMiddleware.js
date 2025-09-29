const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No hay token, autorización denegada.' });
    }

    try {
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Formato de token no válido, autorización denegada.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded.user;

        next();

    } catch (error) {
        console.error('Error de autenticación:', error.message);
        res.status(401).json({ message: 'El token no es válido.' });
    }
};

module.exports = authMiddleware;
