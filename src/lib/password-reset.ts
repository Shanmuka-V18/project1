import crypto from 'crypto';

export interface ResetTokenRecord {
  email: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}

// In-memory store for reset tokens (persisted across API invocations in process memory)
const globalStore = global as unknown as { resetTokensStore: Map<string, ResetTokenRecord> };
if (!globalStore.resetTokensStore) {
  globalStore.resetTokensStore = new Map<string, ResetTokenRecord>();
}

const tokenStore = globalStore.resetTokensStore;

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically random, single-use, 15-minute time-limited password reset token.
 */
export function createPasswordResetToken(email: string): { rawToken: string; expiresAt: Date; resetUrl: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  tokenStore.set(tokenHash, {
    email: email.toLowerCase(),
    tokenHash,
    expiresAt: expiresAt.getTime(),
    used: false,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/forgot-password/reset?token=${rawToken}`;

  console.log(`[PASSWORD RESET SERVICE] Generated token for ${email}: ${resetUrl}`);

  return { rawToken, expiresAt, resetUrl };
}

/**
 * Validates a raw reset token for single-use & expiration.
 * Invalidates (consumes) the token upon successful verification.
 */
export function verifyAndConsumeResetToken(rawToken: string): string | null {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashToken(rawToken);
  const record = tokenStore.get(tokenHash);

  if (!record) {
    return null; // Token does not exist
  }

  if (record.used) {
    return null; // Token already consumed (single-use)
  }

  if (Date.now() > record.expiresAt) {
    tokenStore.delete(tokenHash);
    return null; // Token expired
  }

  // Mark token as used (single-use invalidation)
  record.used = true;
  tokenStore.set(tokenHash, record);

  return record.email;
}
