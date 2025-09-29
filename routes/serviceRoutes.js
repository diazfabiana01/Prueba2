const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const PRICE_PER_OPERATOR_PER_DAY = 25000;

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { serviceDate, operatorCount, serviceDays } = req.body;

        const userId = req.user.id;

        if (!serviceDate || !operatorCount || !serviceDays) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        const totalCost = parseInt(operatorCount) * parseInt(serviceDays) * PRICE_PER_OPERATOR_PER_DAY;

        const [result] = await db.query(
            'INSERT INTO services (user_id, service_date, operator_count, service_days, total_cost) VALUES (?, ?, ?, ?, ?)',
            [userId, serviceDate, operatorCount, serviceDays, totalCost]
        );

        res.status(201).json({ 
            message: 'Servicio solicitado exitosamente.', 
            serviceId: result.insertId,
            details: {
                userId,
                serviceDate,
                operatorCount,
                serviceDays,
                totalCost
            }
        });

    } catch (error) {
        console.error('Error al solicitar el servicio:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [services] = await db.query('SELECT * FROM services WHERE user_id = ? ORDER BY request_date DESC', [userId]);
        res.json(services);
    } catch (error) {
        console.error('Error al obtener los servicios:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const userId = req.user.id;
        const { serviceDate } = req.body;

        if (!serviceDate) {
            return res.status(400).json({ message: 'La nueva fecha es obligatoria.' });
        }

        const [services] = await db.query('SELECT * FROM services WHERE id = ? AND user_id = ?', [serviceId, userId]);
        if (services.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado o no autorizado.' });
        }

        await db.query('UPDATE services SET service_date = ? WHERE id = ?', [serviceDate, serviceId]);
        
        res.json({ message: 'Servicio actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar el servicio:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const userId = req.user.id;

        const [services] = await db.query('SELECT * FROM services WHERE id = ? AND user_id = ?', [serviceId, userId]);
        if (services.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado o no autorizado.' });
        }

        await db.query('DELETE FROM services WHERE id = ?', [serviceId]);
        
        res.json({ message: 'Servicio cancelado correctamente.' });
    } catch (error) {
        console.error('Error al cancelar el servicio:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});


module.exports = router;
