-- Esquema mínimo para Inventario
-- Roles y usuarios
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol_id INTEGER REFERENCES roles(id)
);

-- Proveedores y categorías
CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  contacto VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio_compra NUMERIC(12,2) DEFAULT 0,
  precio_venta NUMERIC(12,2) DEFAULT 0,
  cantidad INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  categoria_id INTEGER REFERENCES categorias(id),
  proveedor_id INTEGER REFERENCES proveedores(id)
);

-- Ventas y detalle
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  total NUMERIC(12,2) DEFAULT 0,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_venta (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER,
  precio_unitario NUMERIC(12,2)
);

-- Compras y detalle
CREATE TABLE IF NOT EXISTS compras (
  id SERIAL PRIMARY KEY,
  total NUMERIC(12,2) DEFAULT 0,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_compra (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER,
  precio_unitario NUMERIC(12,2)
);

-- Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  tipo VARCHAR(50),
  cantidad INTEGER,
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT NOW()
);

-- Seeds básicos
INSERT INTO roles (nombre) VALUES ('admin') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('vendedor') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('comprador') ON CONFLICT (nombre) DO NOTHING;

-- Usuario admin de ejemplo (contraseña: admin123)
INSERT INTO usuarios (username, password, rol_id)
SELECT 'admin', 'admin123', r.id FROM roles r WHERE r.nombre='admin' AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.username='admin');
