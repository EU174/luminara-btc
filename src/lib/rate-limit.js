// Stable API rate-limit contract. Static routes are deliberately excluded by
// server.js; login/nonce routes opt into tighter named groups below.
export const isApiRequest = (req) => /^\/api(?:\/|$)/.test(String(req.raw?.url || req.url || '').split('?')[0]);

export function apiRateLimitError(_req, context) {
  const retryAfterSeconds = Math.max(1, Math.ceil(Number(context.ttl || 1000) / 1000));
  return {
    statusCode: 429,
    error: 'rate_limited',
    message: 'Too many requests. Please retry shortly.',
    retry_after_seconds: retryAfterSeconds,
  };
}

export const AUTH_LOGIN_RATE_LIMIT = Object.freeze({ max: 20, timeWindow: '1 minute', groupId: 'auth-login' });
export const AUTH_REFRESH_RATE_LIMIT = Object.freeze({ max: 60, timeWindow: '1 minute', groupId: 'auth-refresh' });
export const AUTH_NONCE_RATE_LIMIT = Object.freeze({ max: 30, timeWindow: '1 minute', groupId: 'auth-nonce' });
