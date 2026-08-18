export const SENSITIVE_LOG_PATHS = Object.freeze([
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-telegram-init-data"]',
  'req.body.initData',
  'req.body.hash',
  'req.body.signature',
  'req.body.nonce',
  'req.body.token',
  'req.body.refresh',
  'res.headers["set-cookie"]',
  'response.headers["set-cookie"]',
]);

export function secureLogger(logger) {
  if (logger === false) return false;
  const input = logger === true || logger == null ? {} : logger;
  if (!input || typeof input !== 'object' || typeof input.info === 'function') return input;
  const current = Array.isArray(input.redact)
    ? { paths: input.redact, censor: '[REDACTED]' }
    : { ...(input.redact || {}), paths: input.redact?.paths || [], censor: input.redact?.censor || '[REDACTED]' };
  return {
    ...input,
    redact: { ...current, paths: [...new Set([...current.paths, ...SENSITIVE_LOG_PATHS])] },
  };
}

export function browserSecurityHeaders(publicOrigin) {
  return Object.freeze({
    'Content-Security-Policy': [
      "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; '),
    'Content-Security-Policy-Report-Only': [
      "default-src 'self'",
      "script-src 'self' https://telegram.org",
      "style-src 'self'",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      `connect-src 'self' ${publicOrigin}`,
      "frame-src 'self'",
      "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; '),
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Origin-Agent-Cluster': '?1',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  });
}
