/**
 * Sets (or resets) the Users-section access code.
 *
 *   cd backend
 *   npm run users:set-code -- 'the-new-access-code'
 *   npm run users:set-code                 # prompts, with no echo to the terminal
 *
 * This is deliberately the ONLY way to recover the access code. The Users
 * section has no "forgot the access code" link on purpose: a reset link in
 * the UI would make the second factor worth about as much as the first. If
 * the code is lost, whoever holds the server environment (SUPABASE_SERVICE_
 * ROLE_KEY) runs this; nobody else can.
 *
 * Writes a scrypt hash — never the code itself — to
 * `app_settings.users_section_access_code`, a table RLS locks to the
 * service-role key (migration 005).
 */
import { createInterface } from 'readline';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { Database } from '../src/types/database';
import {
  ACCESS_CODE_SETTING_KEY,
  MIN_ACCESS_CODE_LENGTH,
  hashAccessCode,
} from '../src/users/users-access.crypto';

loadEnv();

async function promptHidden(question: string): Promise<string> {
  const input = process.stdin;
  const output = process.stdout;
  const rl = createInterface({ input, output, terminal: true });

  return new Promise<string>((resolve) => {
    output.write(question);
    // Suppress echo so the code never lands in the terminal scrollback or
    // the shell history of whoever is watching.
    const wasRaw = input.isTTY ? input.isRaw : false;
    if (input.isTTY) input.setRawMode(true);

    let value = '';
    const onData = (chunk: Buffer): void => {
      const char = chunk.toString('utf8');
      if (char === '\r' || char === '\n') {
        if (input.isTTY) input.setRawMode(wasRaw);
        input.removeListener('data', onData);
        output.write('\n');
        rl.close();
        resolve(value);
        return;
      }
      if (char === '\u0003') {
        // Ctrl-C
        output.write('\n');
        process.exit(130);
      }
      if (char === '\u007f' || char === '\b') {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };

    input.on('data', onData);
  });
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    fail(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (backend/.env) — this script writes ' +
        'to a table only the service-role key can reach.',
    );
  }

  let code = process.argv[2];
  if (!code) {
    code = await promptHidden('New Users-section access code: ');
    const confirmation = await promptHidden('Confirm access code: ');
    if (code !== confirmation) fail('The two codes did not match. Nothing was changed.');
  }

  if (code.length < MIN_ACCESS_CODE_LENGTH) {
    fail(`The access code must be at least ${MIN_ACCESS_CODE_LENGTH} characters.`);
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('app_settings').upsert(
    {
      key: ACCESS_CODE_SETTING_KEY,
      value: hashAccessCode(code),
      updated_at: new Date().toISOString(),
      updated_by: null,
    },
    { onConflict: 'key' },
  );

  if (error) {
    fail(
      `Could not write the access code: ${error.message}\n` +
        '  If the table is missing, run db/005_user_accounts.sql in the Supabase SQL editor first.',
    );
  }

  console.log(
    '\n✔ Users-section access code set. Admins will be asked for it the next time they open ' +
      'the Users page (existing unlock sessions stay valid for up to 30 minutes).\n',
  );
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
