// Dedicated Luminara BTC database boundary.
const BOUNDARY_ID = 'luminara_btc';

function validateConnectionString(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('BTC_DATABASE_URL must be a PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)
    || !parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error('BTC_DATABASE_URL must identify a PostgreSQL host and database');
  }
}

export function resolveDatabaseBoundary({ env = {}, deployed = false }) {
  const connectionString = String(env.BTC_DATABASE_URL || '').trim();
  const foreign = String(env.DATABASE_URL || '').trim();
  const declared = String(env.DATABASE_BOUNDARY_ID || '').trim();
  if (deployed) {
    if (!connectionString) throw new Error('BTC_DATABASE_URL is required in deployment');
    if (foreign) throw new Error('DATABASE_URL must be absent from the BTC deployment');
    if (declared !== BOUNDARY_ID) {
      throw new Error(`DATABASE_BOUNDARY_ID must equal ${BOUNDARY_ID}`);
    }
  }
  if (connectionString) validateConnectionString(connectionString);
  return Object.freeze({
    boundaryId: BOUNDARY_ID,
    connectionString: connectionString || undefined,
    configured: Boolean(connectionString),
    sourceEnv: 'BTC_DATABASE_URL',
  });
}

export const DATABASE_BOUNDARY_ID = BOUNDARY_ID;
