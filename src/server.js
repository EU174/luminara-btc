// Listening entry point only. Composition lives in src/app.js.
import { buildApp } from './app.js';
import { config } from './lib/config.js';
import { verifyRuntimeDatabaseIdentity } from './lib/db.js';

// Refuse traffic before listen if the credential targets an unprovisioned database.
await verifyRuntimeDatabaseIdentity();
const app = await buildApp();

try {
  // Railway routes public IPv4 and private IPv6 traffic to the same process.
  // The IPv6 unspecified address keeps Fastify dual-stack on Linux.
  await app.listen({ port: config.port, host: '::' });
  app.log.info(`Luminara BTC API on :${config.port}`);
} catch (e) {
  app.log.error(e);
  process.exit(1);
}
