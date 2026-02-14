-- Tabla de productos
CREATE TABLE productos (
	id SERIAL PRIMARY KEY,
	nombre VARCHAR(100) NOT NULL,
	descripcion TEXT,
	precio_compra NUMERIC(12,2) NOT NULL,
	precio_venta NUMERIC(12,2) NOT NULL,
	cantidad INT NOT NULL,
	stock_minimo INT DEFAULT 0,
	categoria_id INT REFERENCES categorias(id),
	proveedor_id INT REFERENCES proveedores(id)
);

-- Tabla de ventas
CREATE TABLE ventas (
	id SERIAL PRIMARY KEY,
	fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	total NUMERIC(12,2) NOT NULL
);

-- Detalle de ventas
CREATE TABLE detalle_venta (
	id SERIAL PRIMARY KEY,
	venta_id INT REFERENCES ventas(id) ON DELETE CASCADE,
	producto_id INT REFERENCES productos(id),
	cantidad INT NOT NULL,
	precio_unitario NUMERIC(12,2) NOT NULL
);

-- Tabla de compras
CREATE TABLE compras (
	id SERIAL PRIMARY KEY,
	fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	total NUMERIC(12,2) NOT NULL
);

-- Detalle de compras
CREATE TABLE detalle_compra (
	id SERIAL PRIMARY KEY,
	compra_id INT REFERENCES compras(id) ON DELETE CASCADE,
	producto_id INT REFERENCES productos(id),
	cantidad INT NOT NULL,
	precio_unitario NUMERIC(12,2) NOT NULL
);

-- Tabla de usuarios
CREATE TABLE usuarios (
	id SERIAL PRIMARY KEY,
	nombre VARCHAR(100) NOT NULL,
	username VARCHAR(50) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	rol_id INT REFERENCES roles(id)
);

-- Tabla de roles
CREATE TABLE roles (
	id SERIAL PRIMARY KEY,
	nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de proveedores
CREATE TABLE proveedores (
	id SERIAL PRIMARY KEY,
	nombre VARCHAR(100) NOT NULL,
	contacto VARCHAR(100),
	telefono VARCHAR(20),
	direccion TEXT
);

-- Tabla de categorías
CREATE TABLE categorias (
	id SERIAL PRIMARY KEY,
	nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de historial de movimientos
CREATE TABLE movimientos (
	id SERIAL PRIMARY KEY,
	producto_id INT REFERENCES productos(id),
	usuario_id INT REFERENCES usuarios(id),
	tipo VARCHAR(20) NOT NULL, -- 'compra', 'venta', 'ajuste', etc.
	cantidad INT NOT NULL,
	fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	descripcion TEXT
);


-- =========================
-- DATOS DE EJEMPLO INICIALES
-- =========================

-- Roles
INSERT INTO roles (nombre) VALUES ('admin'), ('vendedor'), ('comprador');

-- Usuarios
INSERT INTO usuarios (nombre, username, password, rol_id) VALUES
	('Administrador', 'admin', 'admin123', 1),
	('Vendedor Uno', 'vendedor1', 'vendedor123', 2);

-- Proveedores
INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES
	('Proveedor A', 'Juan Perez', '3001234567', 'Calle 1 #23-45'),
	('Proveedor B', 'Maria Lopez', '3019876543', 'Carrera 2 #34-56');

-- Categorías
INSERT INTO categorias (nombre) VALUES ('Herramientas'), ('Materiales'), ('Pinturas');

-- Productos
INSERT INTO productos (nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo, categoria_id, proveedor_id) VALUES
	('Martillo', 'Martillo de acero', 5000, 8000, 50, 10, 1, 1),
	('Pintura blanca', 'Galón de pintura blanca', 20000, 35000, 20, 5, 3, 2),
	('Cemento', 'Saco de cemento 50kg', 25000, 40000, 100, 20, 2, 1);
