

// ...EXISTING CODE...

// ...existing code...

// (Los endpoints de categorías y proveedores deben ir después de la inicialización de app)
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
app.use(cors({
    origin: '*',
}));

// =========================
// ENDPOINTS PARA DASHBOARD
// =========================
// Ventas por mes (últimos 6 meses)
app.get('/dashboard/ventas-mes', authenticateToken, async (req, res) => {
    try {
        const result = await client.query(`
            SELECT TO_CHAR(fecha, 'TMMonth') AS mes, EXTRACT(MONTH FROM fecha) as mes_num, SUM(total) as total
            FROM ventas
            WHERE fecha >= NOW() - INTERVAL '6 months'
            GROUP BY mes, mes_num
            ORDER BY mes_num
        `);
        const labels = result.rows.map(r => r.mes.trim());
        const values = result.rows.map(r => Number(r.total));
        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ventas por mes' });
    }
});

// Compras por mes (últimos 6 meses)
app.get('/dashboard/compras-mes', authenticateToken, async (req, res) => {
    try {
        const result = await client.query(`
            SELECT TO_CHAR(fecha, 'TMMonth') AS mes, EXTRACT(MONTH FROM fecha) as mes_num, SUM(total) as total
            FROM compras
            WHERE fecha >= NOW() - INTERVAL '6 months'
            GROUP BY mes, mes_num
            ORDER BY mes_num
        `);
        const labels = result.rows.map(r => r.mes.trim());
        const values = result.rows.map(r => Number(r.total));
        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener compras por mes' });
    }
});

// Productos más vendidos (top 5)
app.get('/dashboard/mas-vendidos', authenticateToken, async (req, res) => {
    try {
        const result = await client.query(`
            SELECT p.nombre, SUM(dv.cantidad) as cantidad
            FROM detalle_venta dv
            JOIN productos p ON dv.producto_id = p.id
            GROUP BY p.nombre
            ORDER BY cantidad DESC
            LIMIT 5
        `);
        const labels = result.rows.map(r => r.nombre);
        const values = result.rows.map(r => Number(r.cantidad));
        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener productos más vendidos' });
    }
});
// ...existing code...
// (Los endpoints de categorías y proveedores deben ir después de la inicialización de app)
require('dotenv').config();


// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('--- AUTH DEBUG ---');
    console.log('Authorization header:', authHeader);
    console.log('Token extraído:', token);
    if (!token) {
        console.log('No se recibió token');
        return res.status(401).json({ error: 'Token requerido' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log('Error al verificar token:', err.message);
            return res.status(403).json({ error: 'Token inválido', detalle: err.message });
        }
        req.user = user;
        console.log('Token verificado. Usuario:', user.username, 'Rol:', user.rol);
        next();
    });
}

// Middleware para verificar rol
function authorizeRole(roles) {
    return (req, res, next) => {
        const userRole = (req.user.rol || '').toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        if (!allowedRoles.includes(userRole)) {
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
app.post('/ventas', authenticateToken, authorizeRole(['admin', 'vendedor', 'comprador']), async (req, res) => {
    const { productos } = req.body; // productos: [{producto_id, cantidad, precio_unitario}]
    const usuario_id = req.user && req.user.id;
    if (!productos || !Array.isArray(productos) || productos.length === 0 || !usuario_id) {
        return res.status(400).send('Debes enviar productos para la venta y usuario debe estar autenticado');
    }
    const clientPg = await client.connect();
    try {
        await clientPg.query('BEGIN');
        // Calcular total
        const total = productos.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);
        // Insertar venta (con usuario_id)
        const ventaResult = await clientPg.query(
            'INSERT INTO ventas (total, usuario_id) VALUES ($1, $2) RETURNING id',
            [total, usuario_id]
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
// ENDPOINT DETALLE DE VENTA
// =========================
// Devuelve los productos vendidos en una venta
app.get('/ventas/:id/detalle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query(
            `SELECT dv.cantidad, dv.precio_unitario, p.nombre as producto
             FROM detalle_venta dv
             JOIN productos p ON dv.producto_id = p.id
             WHERE dv.venta_id = $1`,
            [id]
        );
        console.log('Detalle venta para venta_id =', id, '->', result.rows);
        if (result.rows.length === 0) {
            // Responde vacío, pero nunca 404
            return res.json([]);
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error en /ventas/:id/detalle:', error);
        res.status(500).json({ error: 'Error al obtener detalle de venta' });
    }
});

// =========================
// ENDPOINTS DE COMPRAS
// =========================
// Registrar una compra (con detalle y actualización de stock)
// Solo comprador o admin pueden registrar compras
app.post('/compras', authenticateToken, authorizeRole(['admin', 'comprador', 'vendedor']), async (req, res) => {
    const { productos } = req.body; // productos: [{producto_id, cantidad, precio_unitario}]
    const usuario_id = req.user && req.user.id;
    if (!productos || !Array.isArray(productos) || productos.length === 0 || !usuario_id) {
        return res.status(400).send('Debes enviar productos para la compra y usuario debe estar autenticado');
    }
    const clientPg = await client.connect();
    try {
        await clientPg.query('BEGIN');
        // Calcular total
        const total = productos.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);
        // Insertar compra (con usuario_id)
        const compraResult = await clientPg.query(
            'INSERT INTO compras (total, usuario_id) VALUES ($1, $2) RETURNING id',
            [total, usuario_id]
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
        // Obtener ventas con total
        const ventasResult = await client.query(
            `SELECT v.*, u.username as usuario, SUM(dv.cantidad * dv.precio_unitario) as total_venta
             FROM ventas v
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             JOIN detalle_venta dv ON v.id = dv.venta_id
             WHERE v.fecha BETWEEN $1 AND $2
             GROUP BY v.id, u.username`,
            [desde, hasta]
        );
        const ventas = ventasResult.rows;
        // Obtener detalle para cada venta
        for (const venta of ventas) {
            const detalleResult = await client.query(
                `SELECT dv.cantidad, dv.precio_unitario, p.nombre as producto
                 FROM detalle_venta dv
                 JOIN productos p ON dv.producto_id = p.id
                 WHERE dv.venta_id = $1`,
                [venta.id]
            );
            venta.detalle = detalleResult.rows;
        }
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener reporte de ventas' });
    }
});

// Reporte de compras por fecha
app.get('/reporte/compras', authenticateToken, authorizeRole(['admin', 'comprador', 'vendedor']), async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        // Obtener compras con total
        const comprasResult = await client.query(
            `SELECT c.*, u.username as usuario, SUM(dc.cantidad * dc.precio_unitario) as total_compra
             FROM compras c
             LEFT JOIN usuarios u ON c.usuario_id = u.id
             JOIN detalle_compra dc ON c.id = dc.compra_id
             WHERE c.fecha BETWEEN $1 AND $2
             GROUP BY c.id, u.username`,
            [desde, hasta]
        );
        const compras = comprasResult.rows;
        // Obtener detalle para cada compra
        for (const compra of compras) {
            const detalleResult = await client.query(
                `SELECT dc.cantidad, dc.precio_unitario, p.nombre as producto
                 FROM detalle_compra dc
                 JOIN productos p ON dc.producto_id = p.id
                 WHERE dc.compra_id = $1`,
                [compra.id]
            );
            compra.detalle = detalleResult.rows;
        }
        res.json(compras);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener reporte de compras' });
    }
});


// =========================
// ENDPOINTS DE CATEGORÍAS Y PROVEEDORES
// =========================
// Obtener todas las categorías
app.get('/categorias', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM categorias ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// Crear categoría
app.post('/categorias', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }
    try {
        const result = await client.query(
            'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
            [nombre]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// Editar categoría
app.put('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }
    try {
        const result = await client.query(
            'UPDATE categorias SET nombre = $1 WHERE id = $2 RETURNING *',
            [nombre, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al editar categoría' });
    }
});

// Eliminar categoría
app.delete('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

// Obtener todos los proveedores
// Obtener todos los proveedores
app.get('/proveedores', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM proveedores ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

// Crear proveedor
app.post('/proveedores', async (req, res) => {
    const { nombre, contacto, telefono, direccion } = req.body;
    if (!nombre || !contacto || !telefono || !direccion) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    try {
        const result = await client.query(
            'INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, contacto, telefono, direccion]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
});

// Editar proveedor
app.put('/proveedores/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, contacto, telefono, direccion } = req.body;
    if (!nombre || !contacto || !telefono || !direccion) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    try {
        const result = await client.query(
            'UPDATE proveedores SET nombre = $1, contacto = $2, telefono = $3, direccion = $4 WHERE id = $5 RETURNING *',
            [nombre, contacto, telefono, direccion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al editar proveedor' });
    }
});

// Eliminar proveedor
app.delete('/proveedores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM proveedores WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
});


// =========================
// ENDPOINTS DE PRESUPUESTOS
// =========================
// Guardar un presupuesto (con detalle)
// Cualquier usuario autenticado puede crear presupuestos
app.post('/presupuestos', authenticateToken, async (req, res) => {
    const { cliente, items } = req.body; // items: [{producto_id, cantidad, precio_unitario}]
    const usuario_id = req.user && req.user.id;
    if (!cliente || !items || !Array.isArray(items) || items.length === 0 || !usuario_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: cliente, items, usuario_id' });
    }
    const clientPg = await client.connect();
    try {
        await clientPg.query('BEGIN');
        // Calcular total
        const total = items.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);
        // Insertar presupuesto (ahora con usuario_id)
        const presupuestoResult = await clientPg.query(
            'INSERT INTO presupuestos (cliente, total, fecha, usuario_id) VALUES ($1, $2, NOW(), $3) RETURNING id, fecha',
            [cliente, total, usuario_id]
        );
        const presupuesto_id = presupuestoResult.rows[0].id;
        // Insertar detalle
        for (const p of items) {
            await clientPg.query(
                'INSERT INTO detalle_presupuesto (presupuesto_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [presupuesto_id, p.producto_id, p.cantidad, p.precio_unitario]
            );
        }
        await clientPg.query('COMMIT');
        res.status(201).json({ mensaje: 'Presupuesto guardado', presupuesto_id, fecha: presupuestoResult.rows[0].fecha });
    } catch (error) {
        await clientPg.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error al guardar presupuesto' });
    } finally {
        clientPg.release();
    }
});

// Obtener historial de presupuestos
// Cualquier usuario autenticado puede ver presupuestos
app.get('/presupuestos', authenticateToken, async (req, res) => {
    try {
        // Obtener todos los presupuestos con el nombre de usuario
        const presupuestosResult = await client.query(`
            SELECT pr.*, u.username as usuario
            FROM presupuestos pr
            LEFT JOIN usuarios u ON pr.usuario_id = u.id
            ORDER BY pr.fecha DESC
        `);
        const presupuestos = presupuestosResult.rows;
        // Por cada presupuesto, obtener su detalle (productos cotizados)
        for (const presupuesto of presupuestos) {
            const detalleResult = await client.query(
                `SELECT d.producto_id, p.nombre, d.cantidad, d.precio_unitario
                 FROM detalle_presupuesto d
                 JOIN productos p ON d.producto_id = p.id
                 WHERE d.presupuesto_id = $1`,
                [presupuesto.id]
            );
            presupuesto.items = detalleResult.rows;
        }
        res.json(presupuestos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener presupuestos' });
    }
});

// =========================
// ENDPOINT DETALLE DE COMPRA
// =========================
// Devuelve los productos comprados en una compra
app.get('/compras/:id/detalle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query(
            `SELECT dc.cantidad, dc.precio_unitario, p.nombre as producto
             FROM detalle_compra dc
             JOIN productos p ON dc.producto_id = p.id
             WHERE dc.compra_id = $1`,
            [id]
        );
        console.log('Detalle compra para compra_id =', id, '->', result.rows);
        if (result.rows.length === 0) {
            return res.json([]);
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error en /compras/:id/detalle:', error);
        res.status(500).json({ error: 'Error al obtener detalle de compra' });
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