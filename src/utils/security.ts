/**
 * Enterprise Client-Side Security & Cryptography Utilities
 * - SHA-256 password hashing with unique cryptographic salt using Web Crypto API.
 * - Persistent brute-force protection with exponential backoff lockout.
 * - Zero plaintext secrets stored in LocalStorage.
 */

export interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number; // Unix timestamp in ms
  lastAttemptTime: number; // Unix timestamp in ms
}

const RATE_LIMIT_STORAGE_KEY = 'mono_admin_ratelimit_v1';
const MIN_COOLDOWN_MS = 1200; // Minimum 1.2s between consecutive attempts to block fast bots

/**
 * Generates a cryptographically strong random salt
 */
export function generateCryptographicSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a password with a unique salt using native Web Crypto SHA-256
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const pepper = 'mono_studio_pepper_2026_secured';
  const data = encoder.encode(`${salt}:${password.trim()}:${pepper}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves the persistent rate limit status from LocalStorage
 */
export function getPersistentRateLimit(): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  isCooldown: boolean;
} {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, isCooldown: false };
    }
    const state: RateLimitState = JSON.parse(raw);
    const now = Date.now();

    const isLocked = state.lockedUntil > now;
    const remainingSeconds = isLocked ? Math.ceil((state.lockedUntil - now) / 1000) : 0;
    const isCooldown = now - state.lastAttemptTime < MIN_COOLDOWN_MS;

    return {
      isLocked,
      remainingSeconds,
      failedAttempts: state.failedAttempts || 0,
      isCooldown,
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, isCooldown: false };
  }
}

/**
 * Records a failed login attempt with exponential backoff penalties:
 * - 3 failed attempts: 30s lockout
 * - 5 failed attempts: 2m (120s) lockout
 * - 7+ failed attempts: 15m (900s) lockout
 */
export function recordFailedAttempt(): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  isCooldown: boolean;
} {
  const now = Date.now();
  let state: RateLimitState = { failedAttempts: 0, lockedUntil: 0, lastAttemptTime: 0 };

  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    // fallback to clean state
  }

  const newAttempts = (state.failedAttempts || 0) + 1;
  let lockDurationMs = 0;

  if (newAttempts >= 7) {
    lockDurationMs = 15 * 60 * 1000; // 15 minutes
  } else if (newAttempts >= 5) {
    lockDurationMs = 2 * 60 * 1000; // 2 minutes
  } else if (newAttempts >= 3) {
    lockDurationMs = 30 * 1000; // 30 seconds
  }

  const lockedUntil = lockDurationMs > 0 ? now + lockDurationMs : 0;

  const updatedState: RateLimitState = {
    failedAttempts: newAttempts,
    lockedUntil,
    lastAttemptTime: now,
  };

  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updatedState));
  } catch {
    // ignore localstorage errors
  }

  return {
    isLocked: lockedUntil > now,
    remainingSeconds: Math.ceil(lockDurationMs / 1000),
    failedAttempts: newAttempts,
    isCooldown: false,
  };
}

/**
 * Resets rate limit upon successful authentication
 */
export function resetRateLimit(): void {
  try {
    localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
