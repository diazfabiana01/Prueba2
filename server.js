const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;

/* ESTA RUTA YA NO ES NECESARIA PORQUE express.static SERVIRÁ EL index.html
app.get('/', (req, res) => {
    // req: objeto de solicitud (request) - contiene información sobre la solicitud del cliente.
    // res: objeto de respuesta (response) - se usa para enviar una respuesta al cliente.
    res.send('¡El API de CLEANUS está funcionando correctamente!');
});
*/

app.use('/api/users', userRoutes);

app.use('/api/services', serviceRoutes);


app.listen(PORT, async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Conexión a la base de datos establecida exitosamente.');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:');
        console.error(`   - Código de error: ${error.code}`);
        console.error(`   - Número de error: ${error.errno}`);
        console.error(`   - Mensaje: ${error.sqlMessage || error.message}`);
        console.error('   - Sugerencia: Verifica las credenciales en tu archivo .env y asegúrate de que el servidor de MySQL esté corriendo.');
    }
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`   Puedes acceder en http://localhost:${PORT}`);
});
