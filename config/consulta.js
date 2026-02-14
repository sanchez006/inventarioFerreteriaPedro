require('dotenv').config();
const client = require('./database.js');
const cors = require('cors');
const express = require('express');
console.log('consulta.js using DB_NAME=', process.env.DB_NAME);
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'inventario_secret';

const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// Middleware para verificar rol
function authorizeRole(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        next();
    };
}

// Middleware de logging simple
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});


// =========================
// ENDPOINT DE LOGIN
// =========================
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    try {
        const result = await client.query('SELECT u.id, u.username, u.password, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        const user = result.rows[0];
        // Comparación simple, para producción usar bcrypt
        if (user.password !== password) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        const token = jwt.sign({ id: user.id, username: user.username, rol: user.rol }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, username: user.username, rol: user.rol } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
        const result = await client.query(
            `SELECT p.*, c.nombre as categoria, pr.nombre as proveedor
             FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
             ORDER BY p.id`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los productos');
    }
});

// Agregar un producto

// Validación y creación de producto
// Solo admin puede crear productos
app.post('/productos', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id } = req.body;
    if (!nombre || !precio_compra || !precio_venta || cantidad == null) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: nombre, precio_compra, precio_venta, cantidad' });
    }
    try {
        const result = await client.query(
            'INSERT INTO productos (nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el producto' });
    }
});

// Actualizar un producto

// Validación y actualización de producto
// Solo admin puede actualizar productos
app.put('/productos/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id } = req.body;
    if (!nombre || !precio_compra || !precio_venta || cantidad == null) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: nombre, precio_compra, precio_venta, cantidad' });
    }
    try {
        const result = await client.query(
            'UPDATE productos SET nombre=$1, descripcion=$2, precio_compra=$3, precio_venta=$4, cantidad=$5, stock_minimo=$6, categoria_id=$7, proveedor_id=$8 WHERE id=$9 RETURNING *',
            [nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// Eliminar un producto

// Eliminación de producto con validación
// Solo admin puede eliminar productos
app.delete('/productos/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM productos WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ mensaje: 'Producto eliminado', producto: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Aquí puedes agregar endpoints para ventas, compras, alertas, etc.

// =========================
// ENDPOINTS DE VENTAS
// =========================
// Registrar una venta (con detalle y actualización de stock)
// Solo vendedor o admin pueden registrar ventas
app.post('/ventas', authenticateToken, authorizeRole(['admin', 'vendedor']), async (req, res) => {
    const { productos, usuario_id } = req.body; // productos: [{producto_id, cantidad, precio_unitario}]
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).send('Debes enviar productos para la venta');
    }
    const clientPg = await client.connect();
    try {
        await clientPg.query('BEGIN');
        // Calcular total
        const total = productos.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);
        // Insertar venta
        const ventaResult = await clientPg.query(
            'INSERT INTO ventas (total) VALUES ($1) RETURNING id',
            [total]
        );
        const venta_id = ventaResult.rows[0].id;
        // Insertar detalle y actualizar stock
        for (const p of productos) {
            await clientPg.query(
                'INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [venta_id, p.producto_id, p.cantidad, p.precio_unitario]
            );
            await clientPg.query(
                'UPDATE productos SET cantidad = cantidad - $1 WHERE id = $2',
                [p.cantidad, p.producto_id]
            );
            await clientPg.query(
                'INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, descripcion) VALUES ($1, $2, $3, $4, $5)',
                [p.producto_id, usuario_id, 'venta', p.cantidad, `Venta registrada #${venta_id}`]
            );
        }
        await clientPg.query('COMMIT');
        res.status(201).json({ mensaje: 'Venta registrada', venta_id });
    } catch (error) {
        await clientPg.query('ROLLBACK');
        console.error(error);
        res.status(500).send('Error al registrar la venta');
    } finally {
        clientPg.release();
    }
});

// =========================
// ENDPOINTS DE COMPRAS
// =========================
// Registrar una compra (con detalle y actualización de stock)
// Solo comprador o admin pueden registrar compras
app.post('/compras', authenticateToken, authorizeRole(['admin', 'comprador']), async (req, res) => {
    const { productos, usuario_id } = req.body; // productos: [{producto_id, cantidad, precio_unitario}]
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).send('Debes enviar productos para la compra');
    }
    const clientPg = await client.connect();
    try {
        await clientPg.query('BEGIN');
        // Calcular total
        const total = productos.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);
        // Insertar compra
        const compraResult = await clientPg.query(
            'INSERT INTO compras (total) VALUES ($1) RETURNING id',
            [total]
        );
        const compra_id = compraResult.rows[0].id;
        // Insertar detalle y actualizar stock
        for (const p of productos) {
            await clientPg.query(
                'INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [compra_id, p.producto_id, p.cantidad, p.precio_unitario]
            );
            await clientPg.query(
                'UPDATE productos SET cantidad = cantidad + $1 WHERE id = $2',
                [p.cantidad, p.producto_id]
            );
            await clientPg.query(
                'INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, descripcion) VALUES ($1, $2, $3, $4, $5)',
                [p.producto_id, usuario_id, 'compra', p.cantidad, `Compra registrada #${compra_id}`]
            );
        }
        await clientPg.query('COMMIT');
        res.status(201).json({ mensaje: 'Compra registrada', compra_id });
    } catch (error) {
        await clientPg.query('ROLLBACK');
        console.error(error);
        res.status(500).send('Error al registrar la compra');
    } finally {
        clientPg.release();
    }
});

// =========================
// ENDPOINT DE ALERTA DE STOCK BAJO
// =========================
// Cualquier usuario autenticado puede ver alertas
// Alertas: stock bajo
app.get('/alertas/stock-bajo', authenticateToken, async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM productos WHERE cantidad <= stock_minimo');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar productos con stock bajo');
    }
});

// =========================
// ENDPOINTS DE REPORTES E HISTORIAL (TOP-LEVEL)
// =========================

// Historial de movimientos
app.get('/movimientos', authenticateToken, async (req, res) => {
    try {
        const result = await client.query('SELECT m.*, p.nombre as producto, u.username as usuario FROM movimientos m JOIN productos p ON m.producto_id = p.id JOIN usuarios u ON m.usuario_id = u.id ORDER BY m.fecha DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial de movimientos' });
    }
});

// Reporte de ventas por fecha
app.get('/reporte/ventas', authenticateToken, authorizeRole(['admin', 'vendedor']), async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const result = await client.query(
            'SELECT v.*, SUM(dv.cantidad * dv.precio_unitario) as total_venta FROM ventas v JOIN detalle_venta dv ON v.id = dv.venta_id WHERE v.fecha BETWEEN $1 AND $2 GROUP BY v.id',
            [desde, hasta]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener reporte de ventas' });
    }
});

// Reporte de compras por fecha
app.get('/reporte/compras', authenticateToken, authorizeRole(['admin', 'comprador']), async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const result = await client.query(
            'SELECT c.*, SUM(dc.cantidad * dc.precio_unitario) as total_compra FROM compras c JOIN detalle_compra dc ON c.id = dc.compra_id WHERE c.fecha BETWEEN $1 AND $2 GROUP BY c.id',
            [desde, hasta]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener reporte de compras' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});


//     } catch(err){
//         console.error("error al obtener resultado",err);

//     }finally{
//         client.end();
//     }
// }

// mostrardatos();