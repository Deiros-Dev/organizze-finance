// Aplica os arquivos .sql de supabase/migrations no banco.
// Uso: npm run db:migrate   (le DATABASE_URL de .env.local ou .env)
// ou:  DATABASE_URL="postgres://..." node scripts/migrate.mjs
//
// Mantem um ledger (public._migrations) com os arquivos ja aplicados, entao
// rodar de novo so aplica o que ainda nao rodou — importante porque algumas
// migracoes (ex.: 0003_auth.sql) fazem alteracoes de sentido unico.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dir = join(root, 'supabase', 'migrations');

// Carrega .env.local / .env sem dependencia externa.
for (const name of ['.env.local', '.env']) {
  const file = join(root, name);
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

const conn =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

if (!conn) {
  console.error(
    'Defina DATABASE_URL em .env.local (Supabase -> Settings -> Database -> Connection string).',
  );
  process.exit(1);
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

// Remove params de SSL da URL — o certificado da Supabase (pooler) nao valida
// na cadeia padrao; conectamos com SSL sem verificacao de CA.
let cleanConn = conn;
try {
  const u = new URL(conn);
  ['sslmode', 'ssl', 'uselibpqcompat', 'supa', 'pgbouncer'].forEach((p) =>
    u.searchParams.delete(p),
  );
  cleanConn = u.toString();
} catch {
  /* mantem a string original */
}

const client = new pg.Client({
  connectionString: cleanConn,
  ssl: { require: true, rejectUnauthorized: false },
});

try {
  await client.connect();

  // Ledger de migracoes ja aplicadas. RLS ligada sem nenhuma policy: só a
  // conexao direta (DATABASE_URL, dona da tabela) enxerga essa tabela —
  // anon/authenticated via API REST nao tem acesso.
  await client.query(`
    create table if not exists public._migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  await client.query('alter table public._migrations enable row level security');

  const { rows } = await client.query('select filename from public._migrations');
  const applied = new Set(rows.map((r) => r.filename));

  for (const f of files) {
    if (applied.has(f)) {
      console.log(`-> ${f} ... já aplicada`);
      continue;
    }
    process.stdout.write(`-> ${f} ... `);
    try {
      await client.query('begin');
      await client.query(readFileSync(join(dir, f), 'utf8'));
      await client.query('insert into public._migrations (filename) values ($1)', [f]);
      await client.query('commit');
      console.log('ok');
    } catch (err) {
      await client.query('rollback');
      throw err;
    }
  }
  console.log('\nMigracoes aplicadas com sucesso.');
} catch (err) {
  console.error('\nFalha:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
