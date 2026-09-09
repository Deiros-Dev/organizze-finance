// Aplica os arquivos .sql de supabase/migrations no banco.
// Uso: DATABASE_URL="postgres://..." node scripts/migrate.mjs
// (ou defina POSTGRES_URL_NON_POOLING / POSTGRES_URL no ambiente)

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'migrations');

const conn =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

if (!conn) {
  console.error(
    'Defina DATABASE_URL (ou POSTGRES_URL_NON_POOLING) no ambiente antes de rodar.',
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
  for (const f of files) {
    process.stdout.write(`-> ${f} ... `);
    await client.query(readFileSync(join(dir, f), 'utf8'));
    console.log('ok');
  }
  console.log('\nMigracoes aplicadas com sucesso.');
} catch (err) {
  console.error('\nFalha:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
