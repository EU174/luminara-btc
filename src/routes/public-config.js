import { config } from '../lib/config.js';
import { publicManifestView } from '../lib/btc-content-manifest.js';

// Public, same-origin runtime configuration for the buildless frontend.
// Never add secrets here: this response is intentionally readable by browsers.
export default async function publicConfigRoutes(app) {
  app.get('/runtime-config.js', async (_req, reply) => {
    const publicConfig = {
      // #95C: the browser receives the immutable boot profile and, for BTC only,
      // the already-reviewed public content manifest. This is presentation input,
      // never an authorization boundary; 95B still enforces exact membership on
      // every server serialization surface.
      siteProfile: 'luminara_btc',
      contentManifest: publicManifestView(),
      telegramBotUsername: config.telegramBotUsername,
      telegramAppSlug: config.telegramAppSlug,
      // Issue #24 staging gate: server-authoritative, NEVER inferred from hostname. Only a
      // boolean crosses the wire — no raw environment name, no token/secret/allowlist/Telegram
      // id. Defaults to false (hidden) if the environment is unset, so an unconfigured server
      // never accidentally advertises a staging-only CTA.
      isStaging: false,
      // C3: the single source of truth for the version badge — validated server config, same
      // value for every locale. Not a secret.
      appVersion: config.appVersion,
    };
    reply
      .type('application/javascript; charset=utf-8')
      .header('Cache-Control', 'no-store, max-age=0');
    // Freeze recursively because the BTC manifest contains nested section/course
    // arrays. A browser mutation may only corrupt presentation (never 95B server
    // authorization), but fail-closed UI should not be widenable accidentally.
    return `(function(){const freeze=(value)=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};window.LUMINARA_PUBLIC_CONFIG=freeze(${JSON.stringify(publicConfig)});})();\n`;
  });
}
