// Single-product Luminara BTC configuration.
// Production credentials are BTC-scoped and never fall back to variables owned
// by another deployment.
import { normalizeHost, parseHostList } from './canonical-origin.js';
import { resolveDatabaseBoundary } from './database-boundary.js';

const deployed = process.env.NODE_ENV === 'production'
  || Boolean(String(process.env.RAILWAY_ENVIRONMENT_ID || '').trim())
  || Boolean(String(process.env.RAILWAY_DEPLOYMENT_ID || '').trim());
const isProd = process.env.NODE_ENV === 'production';

function fatal(message) {
  throw new Error(`configuration: ${message}`);
}

function requiredSecret(name) {
  const value = String(process.env[name] || '').trim();
  if (!deployed) return value || `dev-insecure-${name.toLowerCase()}-not-for-production`;
  if (value.length < 32) fatal(`${name} is required and must be at least 32 characters`);
  if (/(dev-insecure|change-?me|password|secret|test)/i.test(value)) {
    fatal(`${name} must not be a development placeholder`);
  }
  return value;
}

function exactHttpsOrigins(raw) {
  const origins = [];
  for (const item of String(raw || '').split(',').map((value) => value.trim()).filter(Boolean)) {
    if (item === '*') fatal('BTC_CORS_ORIGIN must not contain a wildcard');
    let parsed;
    try { parsed = new URL(item); } catch { fatal('BTC_CORS_ORIGIN contains an invalid URL'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      fatal('BTC_CORS_ORIGIN entries must be bare HTTPS origins');
    }
    origins.push(parsed.origin);
  }
  return Object.freeze(origins);
}

const database = resolveDatabaseBoundary({ env: process.env, deployed });
const publicHost = normalizeHost(process.env.PUBLIC_HOST)
  || (deployed ? null : 'localhost');
if (!publicHost) fatal('PUBLIC_HOST is required for a deployed runtime');
if (/\.btc$/i.test(publicHost)) {
  fatal('PUBLIC_HOST must use a publicly trusted DNS name, not the .btc pseudo-TLD');
}
if (process.env.PUBLIC_HOST && !normalizeHost(process.env.PUBLIC_HOST)) {
  fatal('PUBLIC_HOST must be a hostname without protocol, path or port');
}

const canonicalRedirectEnabled = process.env.CANONICAL_REDIRECT_ENABLED === 'true';
const canonicalRedirectHosts = parseHostList(process.env.CANONICAL_REDIRECT_HOSTS || '');
if (canonicalRedirectEnabled && canonicalRedirectHosts.size === 0) {
  fatal('CANONICAL_REDIRECT_HOSTS is required when redirects are enabled');
}

const jwtSecret = requiredSecret('BTC_JWT_SECRET');
const refreshSecret = requiredSecret('BTC_REFRESH_SECRET');
if (deployed && jwtSecret === refreshSecret) fatal('BTC_JWT_SECRET and BTC_REFRESH_SECRET must differ');

const telegramBotToken = String(process.env.BTC_TELEGRAM_BOT_TOKEN || '').trim();
const telegramBotUsername = String(process.env.BTC_TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '');
const telegramAppSlug = String(process.env.BTC_TELEGRAM_APP_SLUG || 'atlas').trim();
if (deployed && !/^\d{5,20}:[A-Za-z0-9_-]{20,}$/.test(telegramBotToken)) {
  fatal('BTC_TELEGRAM_BOT_TOKEN is missing or invalid');
}
if (deployed && !/^[A-Za-z0-9_]{5,32}$/.test(telegramBotUsername)) {
  fatal('BTC_TELEGRAM_BOT_USERNAME is missing or invalid');
}
if (!/^[A-Za-z0-9_]{1,64}$/.test(telegramAppSlug)) {
  fatal('BTC_TELEGRAM_APP_SLUG is invalid');
}

const appVersion = String(process.env.APP_VERSION || '').trim();
if (deployed && !/^v\d+(\.\d+)?$/.test(appVersion)) {
  fatal('APP_VERSION must look like v1 or v1.2');
}

export const config = Object.freeze({
  port: Number.parseInt(process.env.PORT || '3000', 10),
  databaseUrl: database.connectionString,
  databaseConfigured: database.configured,
  databaseBoundaryId: database.boundaryId,
  databaseUrlEnv: database.sourceEnv,
  isDeployed: deployed,
  isProd,
  secureCookies: deployed,
  sessionIpStorageEnabled: false,
  accountDefaultLocale: 'en',
  telegramLocaleAutoSelectEnabled: false,
  jwtSecret,
  refreshSecret,
  telegramBotToken,
  telegramBotUsername,
  telegramAppSlug,
  superadminTgIds: Object.freeze(
    String(process.env.BTC_SUPERADMIN_TG_IDS || '').split(',').map((id) => id.trim()).filter(Boolean),
  ),
  corsAllowlist: exactHttpsOrigins(process.env.BTC_CORS_ORIGIN),
  publicHost,
  publicOrigin: `https://${publicHost}`,
  canonicalRedirectEnabled,
  canonicalRedirectHosts,
  privateIndexingEnabled: process.env.PRIVATE_INDEXING_ENABLED === 'true',
  accessTtl: '15m',
  refreshTtlDays: 30,
  refreshReuseGraceMs: 5000,
  maxActiveSessions: 2,
  appVersion: appVersion || 'v0.0-dev',
  siteProfile: 'luminara_btc',
  site: Object.freeze({
    profile: 'luminara_btc',
    siteId: 'luminara_btc',
    tokenIssuerId: 'luminara-btc',
    tokenAudienceId: 'luminara-btc-app',
  }),
});
