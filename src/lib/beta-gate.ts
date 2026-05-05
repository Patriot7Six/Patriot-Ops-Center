// Edge-runtime safe HMAC for the beta-access cookie.
// The shared password (BETA_ACCESS_PASSWORD) doubles as the HMAC key — rotating
// the env var invalidates every issued cookie, which is the intended way to
// revoke beta access.

export const BETA_GATE_COOKIE = 'beta_access'
export const BETA_GATE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const encoder = new TextEncoder()

async function hmac(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signGateToken(password: string, ttlMs = BETA_GATE_TTL_MS): Promise<string> {
  const expiresAt = Date.now() + ttlMs
  const sig = await hmac(password, String(expiresAt))
  return `${expiresAt}.${sig}`
}

export async function verifyGateToken(token: string | undefined, password: string): Promise<boolean> {
  if (!token || !password) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const expiresAt = Number(token.slice(0, dot))
  const sig = token.slice(dot + 1)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  const expected = await hmac(password, String(expiresAt))
  // Constant-time compare
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}
