export interface EnvConfig {
  PORT: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** Comma-separated allowed CORS origin(s) for the deployed frontend. Unset in local dev — CORS stays permissive then. */
  FRONTEND_URL: string | null;
}

const REQUIRED_KEYS: Array<keyof EnvConfig> = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

/**
 * Fails fast on boot if Supabase credentials are missing, rather than
 * limping along and throwing opaque errors on the first request. See
 * CLAUDE.md — these must come from Gideon, never invented placeholders.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const missing = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Set these in backend/.env — see backend/.env.example. ' +
        'Do not invent placeholder values.',
    );
  }

  return {
    PORT: config.PORT ? Number(config.PORT) : 3000,
    SUPABASE_URL: String(config.SUPABASE_URL),
    SUPABASE_ANON_KEY: String(config.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: String(config.SUPABASE_SERVICE_ROLE_KEY),
    FRONTEND_URL:
      typeof config.FRONTEND_URL === 'string' && config.FRONTEND_URL.length > 0
        ? config.FRONTEND_URL
        : null,
  };
}
