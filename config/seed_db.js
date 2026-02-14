require('dotenv').config();
const pool = require('./database.js');

async function seed() {
  try {
    // Categoría
    // Insertar categoria si no existe
    let categoriaId;
    const catCheck = await pool.query("SELECT id FROM categorias WHERE nombre=$1 LIMIT 1", ['General']);
    if (catCheck.rows.length > 0) {
      categoriaId = catCheck.rows[0].id;
    } else {
      const catRes = await pool.query("INSERT INTO categorias (nombre) VALUES ($1) RETURNING id", ['General']);
      categoriaId = catRes.rows[0].id;
    }

    // Proveedor
    // Insertar proveedor si no existe
    let proveedorId;
    const provCheck = await pool.query("SELECT id FROM proveedores WHERE nombre=$1 LIMIT 1", ['Proveedor 1']);
    if (provCheck.rows.length > 0) {
      proveedorId = provCheck.rows[0].id;
    } else {
      const provRes = await pool.query("INSERT INTO proveedores (nombre, contacto) VALUES ($1,$2) RETURNING id", ['Proveedor 1', 'contacto@proveedor1.com']);
      proveedorId = provRes.rows[0].id;
    }

    // Productos de ejemplo
    const productos = [
      {
        nombre: 'Producto A',
        descripcion: 'Descripción de ejemplo A',
        precio_compra: 10.0,
        precio_venta: 15.0,
        cantidad: 100,
      },
      {
        nombre: 'Producto B',
        descripcion: 'Descripción de ejemplo B',
        precio_compra: 5.5,
        precio_venta: 9.99,
        cantidad: 50,
      }
    ];

    for (const p of productos) {
      const exists = await pool.query('SELECT id FROM productos WHERE nombre=$1 LIMIT 1', [p.nombre]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO productos (nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [p.nombre, p.descripcion, p.precio_compra, p.precio_venta, p.cantidad, 5, categoriaId, proveedorId]
        );
      }
    }

    console.log('Seed aplicado correctamente.');
  } catch (err) {
    console.error('Error al aplicar seed:', err.message || err);
  } finally {
    // Do not end the pool here if other parts of the app need it, but for the script we can end.
    await pool.end();
  }
}

seed();
