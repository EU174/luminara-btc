// Luminara BTC public runtime composition.
//
// This repository is a single-product export. Routes are registered explicitly;
// there is no tenant selector and no dormant main-product capability graph.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './lib/config.js';
import { resolveContentPolicy } from './lib/content-policy.js';
import { requireFreshAuth } from './lib/middleware.js';
import { browserSecurityHeaders, secureLogger } from './lib/browser-security.js';
import { telegramAuthRoutes, sessionRoutes } from './routes/auth.js';
import { accountRoutes, insightsRoutes } from './routes/api.js';
import { progressRoutes, consentRoutes, accountDeletionRoutes } from './routes/extra.js';
import tgWidgetRoutes from './routes/tg-widget.js';
import statsRoutes from './routes/stats.js';
import publicConfigRoutes from './routes/public-config.js';
import contentRoutes from './routes/content.js';
import quizRoutes from './routes/quiz.js';
import luminaraStatic from './static.js';
import { canonicalRedirect } from './lib/canonical-origin.js';
import { apiRateLimitError, isApiRequest } from './lib/rate-limit.js';

export async function buildApp({ logger = true, onRoute = null } = {}) {
  const app = Fastify({ logger: secureLogger(logger), trustProxy: true });
  const securityHeaders = browserSecurityHeaders(config.publicOrigin);

  if (onRoute !== null) {
    if (typeof onRoute !== 'function') throw new TypeError('onRoute must be a function');
    app.addHook('onRoute', onRoute);
  }

  await app.register(cors, {
    origin: config.corsAllowlist.length ? [...config.corsAllowlist] : false,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 240,
    timeWindow: '1 minute',
    allowList: (req) => !isApiRequest(req),
    errorResponseBuilder: apiRateLimitError,
  });

  app.addHook('onRequest', async (req, reply) => {
    const location = canonicalRedirect({
      method: req.method,
      rawUrl: req.raw?.url || req.url,
      headers: req.headers,
      canonicalHost: config.publicHost,
      redirectEnabled: config.canonicalRedirectEnabled,
      redirectHosts: config.canonicalRedirectHosts,
    });
    if (location) return reply.code(308).header('Location', location).send();
  });
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('X-DNS-Prefetch-Control', 'off');
    for (const [name, value] of Object.entries(securityHeaders)) reply.header(name, value);
    if (config.privateIndexingEnabled) {
      reply.header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    }
    return payload;
  });

  app.get('/robots.txt', async (_req, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return config.privateIndexingEnabled
      ? 'User-agent: *\nDisallow: /\n'
      : 'User-agent: *\nDisallow:\n';
  });
  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  await app.register(telegramAuthRoutes);
  await app.register(tgWidgetRoutes);
  await app.register(sessionRoutes);
  await app.register(accountRoutes);
  await app.register(consentRoutes);
  await app.register(accountDeletionRoutes);
  await app.register(statsRoutes);
  await app.register(progressRoutes);
  await app.register(insightsRoutes, { writeGuards: [requireFreshAuth] });

  const contentPolicy = resolveContentPolicy();
  await app.register(contentRoutes, { policy: contentPolicy });
  await app.register(quizRoutes, { policy: contentPolicy });

  await app.register(publicConfigRoutes);
  await app.register(luminaraStatic);

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    if (err && (err.name === 'ZodError' || Array.isArray(err.issues))) {
      const first = (err.issues && err.issues[0]) || null;
      const where = first?.path?.length ? first.path.join('.') : 'body';
      return reply.code(400).send({
        error: 'validation',
        message: first ? `${where}: ${first.message}` : 'Invalid request',
      });
    }
    const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    return reply.code(code).send({
      error: code === 500 ? 'internal' : 'error',
      message: code === 500 ? 'Internal error' : err.message,
    });
  });

  return app;
}

export default buildApp;
