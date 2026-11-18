import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Hashing and ticket signing for the Users-section access code.
 *
 * Kept as plain functions in their own file (no Nest DI) so the
 * `npm run users:set-code` script can reuse exactly the same hash format
 * as the running API — two implementations of this would be a bug waiting
 * to happen.
 *
 * scrypt from node's stdlib rather than bcrypt/argon2: one fewer native
 * dependency to build on a deploy box, and this is a single shared
 * passphrase guarding an already-authenticated admin-only area, not a
 * per-user password table.
 */

const SCRYPT_COST = 16384; // N; r=8, p=1 (node defaults)
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export const ACCESS_CODE_SETTING_KEY = 'users_section_access_code';

/** Minimum length enforced everywhere a new code is set. */
export const MIN_ACCESS_CODE_LENGTH = 8;

/** Produces `scrypt$<N>$<salt-hex>$<hash-hex>`. */
export function hashAccessCode(code: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(code.normalize('NFKC'), salt, KEY_LENGTH, { N: SCRYPT_COST });
  return `scrypt$${SCRYPT_COST}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Constant-time check of a candidate code against a stored hash. */
export function verifyAccessCode(code: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;

  const cost = Number(parts[1]);
  if (!Number.isInteger(cost) || cost <= 0) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], 'hex');
    expected = Buffer.from(parts[3], 'hex');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = scryptSync(code.normalize('NFKC'), salt, expected.length, { N: cost });
  return timingSafeEqual(actual, expected);
}

/**
 * The short-lived ticket proving "this admin typed the access code".
 *
 * It is a signed, expiring HMAC over the admin's own profile id, so a
 * ticket is useless with anyone else's bearer token and useless after it
 * expires. It is not a bearer credential on its own: every gated route
 * still requires a valid session AND the admin role AND this ticket.
 */
export interface AccessTicket {
  token: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
}

export function signAccessTicket(
  signingKey: Buffer,
  userId: string,
  ttlMs: number,
  now: number = Date.now(),
): AccessTicket {
  const expiresAt = now + ttlMs;
  const payload = `${userId}.${expiresAt}`;
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = createHmac('sha256', signingKey).update(payload).digest('base64url');
  return { token: `${encoded}.${signature}`, expiresAt };
}

export function verifyAccessTicket(
  signingKey: Buffer,
  token: string,
  userId: string,
  now: number = Date.now(),
): boolean {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const expectedSignature = createHmac('sha256', signingKey).update(payload).digest('base64url');
  const given = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;

  const lastDot = payload.lastIndexOf('.');
  if (lastDot <= 0) return false;

  const ticketUserId = payload.slice(0, lastDot);
  const expiresAt = Number(payload.slice(lastDot + 1));
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const a = Buffer.from(ticketUserId, 'utf8');
  const b = Buffer.from(userId, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
