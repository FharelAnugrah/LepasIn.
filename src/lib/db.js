import pg from 'pg';

const { Pool } = pg;

// Cegah pembuatan multiple connection pool saat hot-reloading di development
const globalForPg = globalThis;

if (!globalForPg._pgPool) {
  globalForPg._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lepasin',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = globalForPg._pgPool;

/**
 * Eksekusi parameterized query Raw SQL
 * @param {string} text Query SQL dengan $1, $2, dst.
 * @param {Array} params Parameter query
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', {
      query: text.replace(/\s+/g, ' ').trim(),
      error: error.message,
    });
    throw error;
  }
}

/**
 * Ambil client untuk transaksi database manual
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Eksekusi callback di dalam transaksi database atomik (BEGIN ... COMMIT / ROLLBACK)
 * @param {(client: pg.PoolClient) => Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
