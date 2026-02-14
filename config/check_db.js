require('dotenv').config();
const pool = require('./database.js');

async function check() {
  try {
    const dbRes = await pool.query('SELECT current_database() as db');
    console.log('Current database:', dbRes.rows[0].db);

    const countRes = await pool.query('SELECT COUNT(*)::int as count FROM productos');
    console.log('Productos count:', countRes.rows[0].count);

    const rows = await pool.query('SELECT id, nombre, descripcion, precio_compra, precio_venta, cantidad FROM productos ORDER BY id');
    console.log('Productos rows:');
    console.table(rows.rows);
  } catch (err) {
    console.error('Error checking DB:', err.message || err);
  } finally {
    await pool.end();
  }
}

check();
