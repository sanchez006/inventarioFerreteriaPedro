require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'inventariopedro',
    database: process.env.DB_NAME || 'inventario',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
    console.log('Conexión exitosa a la base de datos');
});

console.log(`DB connect config: host=${process.env.DB_HOST||'localhost'} user=${process.env.DB_USER||'postgres'} db=${process.env.DB_NAME||'inventario'} port=${process.env.DB_PORT||5432}`);

pool.on('error', (err) => {
    console.error('Error en la conexión a la base de datos', err);
});

module.exports = pool;