// Issue #91 / chunk 91B — database-resident identity marker.
//
// Environment variables select a credential; this marker proves what the
// connected database was provisioned to be. It is deliberately stored outside
// the application tables and checked before the BTC server listens or migrates.

export const DATABASE_IDENTITY_SCHEMA = 'luminara_system';
export const DATABASE_IDENTITY_TABLE = 'database_identity';
export const DATABASE_IDENTITY_KEY = 'primary';

export async function readDatabaseIdentity(queryable) {
  if (!queryable || typeof queryable.query !== 'function') {
    throw new TypeError('database identity check requires a queryable client');
  }
  try {
    const { rows } = await queryable.query(
      `SELECT boundary_id, initialized_at
         FROM luminara_system.database_identity
        WHERE identity_key=$1`,
      [DATABASE_IDENTITY_KEY],
    );
    return rows[0] || null;
  } catch (error) {
    // PostgreSQL undefined_table / undefined_schema. Do not hide permission,
    // transport or syntax errors behind a misleading "missing marker" result.
    if (error?.code === '42P01' || error?.code === '3F000') return null;
    throw error;
  }
}

export async function assertDatabaseIdentity(queryable, expectedBoundaryId) {
  if (typeof expectedBoundaryId !== 'string' || !expectedBoundaryId.trim()) {
    throw new TypeError('database identity check requires an expected boundary id');
  }
  const identity = await readDatabaseIdentity(queryable);
  if (!identity) {
    throw new Error(`database identity marker is missing; expected ${expectedBoundaryId}`);
  }
  if (identity.boundary_id !== expectedBoundaryId) {
    throw new Error(`database identity mismatch; expected ${expectedBoundaryId}`);
  }
  return Object.freeze({
    boundaryId: identity.boundary_id,
    initializedAt: identity.initialized_at,
  });
}
