require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'inventariopedro';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 5432;
const TARGET_DB = process.env.DB_NAME || 'inventario';

async function main() {
  // Connect to default 'postgres' database to create the target DB if needed
  const adminClient = new Client({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [TARGET_DB]);
    if (exists.rows.length === 0) {
      console.log(`Creando base de datos '${TARGET_DB}'...`);
      await adminClient.query(`CREATE DATABASE ${TARGET_DB}`);
      console.log('Base de datos creada.');
    } else {
      console.log(`Base de datos '${TARGET_DB}' ya existe.`);
    }
  } catch (err) {
    console.error('Error conectando al servidor Postgres (admin):', err.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Ahora ejecutar el esquema SQL en la base TARGET_DB
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('No se encontró el archivo de esquema:', schemaPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: TARGET_DB
  });

  try {
    await client.connect();
    console.log('Aplicando esquema SQL...');
    await client.query(sql);
    console.log('Esquema aplicado correctamente.');
  } catch (err) {
    console.error('Error aplicando esquema SQL:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
