// Serve the Luminara BTC frontend from the same origin as the API.
//
// Why same-origin: the page and the API share one https origin, so the refresh
// host-only refresh cookie stays first-party (works in Telegram webviews) and CORS is
// not involved at all.
//
// Register this AFTER your API routes so /api/v1 and /health always win:
//
//   import luminaraStatic from './static.js';
//   ...
// Register this plugin after every API route.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';

const here = path.dirname(fileURLToPath(import.meta.url));

export default async function luminaraStatic(app, opts = {}) {
  await app.register(fastifyStatic, {
    root: opts.root || path.join(here, 'public'),
    // The root `/` serves the v62 app. v62.html uses relative asset paths
    // (v62/…), which resolve the same at `/`. The legacy index.html frontend was
    // removed (fully superseded by v62), so it is no longer listed here.
    index: ['v62.html'],
    // Default wildcard registers GET /* for unmatched paths; the API routes are
    // registered earlier and are more specific, so they still take precedence.
    // Unknown paths fall through to a normal 404 (we don't do SPA fallback —
    // v62.html boots everything itself).
    // We set cache headers ourselves so the HTML no-cache isn't overridden by
    // the plugin's own cacheControl/maxAge handling.
    cacheControl: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        // Always revalidate the HTML entry so a redeploy shows up immediately.
        res.setHeader('cache-control', 'no-cache, must-revalidate');
      } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        // CACHE-FIX: app code must revalidate too. Previously .jsx/.js/.css got max-age=3600, so a
        // redeploy that reused the same ?v= served stale scripts for up to an hour (users had to
        // hard-refresh). no-cache = "cache but check freshness via ETag": unchanged → 304 (fast),
        // changed → served fresh. Pairs with the ?v= auto-bump in deploy.py.
        res.setHeader('cache-control', 'no-cache, must-revalidate');
      } else {
        // Images / fonts / other assets — normal caching.
        res.setHeader('cache-control', 'public, max-age=3600');
      }
    },
  });

  // Public reader entrypoint. Keep this extensionless so Telegram Mini App and
  // ordinary browser links expose a durable product URL rather than the
  // implementation filename. Because `/atlas` has no trailing slash, relative
  // `v62/...` assets still resolve from the origin root exactly as they do for
  // `/v62.html`.
  app.get('/atlas', async (_req, reply) => reply.sendFile('v62.html'));

  // Normalize the accidental directory form and retain its server-visible
  // query string. Fragments are not sent to the server and browsers preserve
  // them across this same-origin permanent redirect.
  app.get('/atlas/', async (req, reply) => {
    const rawUrl = String(req.raw?.url || req.url || '');
    const query = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : '';
    return reply.code(308).header('Location', `/atlas${query}`).send();
  });

  // Backward compatibility for bookmarks, old Telegram configuration and
  // previously shared reader URLs. API/auth routes are unaffected because this
  // is an exact GET/HEAD web route.
  app.get('/v62.html', async (req, reply) => {
    const rawUrl = String(req.raw?.url || req.url || '');
    const query = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : '';
    return reply.code(308).header('Location', `/atlas${query}`).send();
  });
}
