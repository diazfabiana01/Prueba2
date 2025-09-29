const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/register', upload.single('idDocument'), async (req, res) => {
    try {
        const { fullName, email, phone, password, street, number, city, zipCode } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'El documento de identidad es requerido.' });
        }
        
        const idDocumentPath = req.file.path;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (full_name, email, phone, password, street, `number`, city, zip_code, id_document_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [fullName, email, phone, hashedPassword, street, number, city, zipCode, idDocumentPath]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente.', userId: result.insertId });

    } catch (error) {
        console.error('Error en el registro:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [loginEmail]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const user = users[0];

        const isPasswordCorrect = await bcrypt.compare(loginPassword, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const payload = { 
            user: {
                id: user.id
            } 
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (error, token) => {
                if (error) throw error;
                
                const { password, ...userWithoutPassword } = user;
                res.json({
                    message: 'Inicio de sesión exitoso.',
                    token,
                    user: userWithoutPassword
                });
            }
        );

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

module.exports = router;
