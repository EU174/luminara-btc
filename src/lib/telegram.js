import crypto from 'node:crypto';
import { config } from './config.js';

// Verify Telegram Mini App initData per official algorithm:
// secret = HMAC_SHA256(bot_token, "WebAppData"); check hash over sorted data_check_string.
// Returns parsed user object {id, username, ...} if valid, else null.
export function verifyTelegramInitData(initData) {
  if (!initData || !config.telegramBotToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(config.telegramBotToken).digest();
  const computed = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString).digest('hex');

  // Timing-safe compare (both are SHA-256 hex digests). A malformed/short hash
  // fails the length check rather than throwing.
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // Freshness: require auth_date, reject stale (>24h) AND future (beyond small skew).
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  const now = Date.now() / 1000;
  const SKEW = 60; // seconds of allowed clock skew
  if (!authDate || now - authDate > 86400 || authDate - now > SKEW) return null;

  try {
    const userJson = params.get('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}
