import { Pool } from 'pg';
import { config } from '../config';

// AWS RDS PostgreSQL connection pool
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: config.database.ssl ? {
    rejectUnauthorized: false
  } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}
