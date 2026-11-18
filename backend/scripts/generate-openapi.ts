/**
 * Writes `backend/openapi.json` — the API contract Gideon hands to Lovable.
 *
 *   cd backend && npm run openapi
 *
 * Why this exists alongside `main.ts` (which writes the same file on boot):
 * booting needs real Supabase credentials and a free port. Regenerating the
 * contract after changing a DTO should not. This builds the Nest app
 * without listening, so it runs anywhere — including CI — and there is no
 * excuse for a stale spec, which CLAUDE.md rightly calls a bug rather than
 * a nitpick.
 *
 * Supabase values come from `.env` when present and are otherwise filled
 * with obvious non-secrets: nothing here connects to anything, the clients
 * are only constructed. These placeholders live in this one process and are
 * never written to `.env`.
 *
 * Note the import order below. `ConfigModule.forRoot({ validate })` runs its
 * validation when `app.module.ts` is *evaluated*, not when the app is
 * created — and static ES imports are hoisted above everything else. So
 * AppModule has to be pulled in with `await import(...)` after the env is
 * in place, or validation fails before the first line of main() runs.
 */
import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';

loadEnv();

process.env.SUPABASE_URL ||= 'http://openapi-generation.invalid';
process.env.SUPABASE_ANON_KEY ||= 'openapi-generation-only';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'openapi-generation-only';

async function main(): Promise<void> {
  const { AppModule } = await import('../src/app.module');
  const { buildOpenApiDocument } = await import('../src/openapi');

  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.init();

  const document = buildOpenApiDocument(app);
  const target = join(__dirname, '..', 'openapi.json');
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);

  await app.close();

  console.log(`Wrote openapi.json (${Object.keys(document.paths).length} paths).`);
}

main().catch((error: unknown) => {
  console.error('Failed to generate openapi.json:', error);
  process.exit(1);
});
