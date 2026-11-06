import { cp, copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Only package Next.js traced production runtime files, never local secrets.
const root = resolve(import.meta.dirname, '..');
const standalone = join(root, '.next', 'standalone');
const output = join(root, 'dist-node');

async function isDirectory(path) {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}
if (!(await isDirectory(standalone))) {
  console.error('Geen standalone build gevonden. Voer eerst pnpm build uit.');
  process.exitCode = 1;
} else {
  await rm(output, { recursive: true, force: true });
  await cp(standalone, output, { recursive: true });
  // Never put local environment files into a deployable ZIP.
  for (const name of ['.env', '.env.local', '.env.production', '.env.production.local', '.dev.vars']) {
    await rm(join(output, name), { force: true });
  }
  await mkdir(join(output, '.next'), { recursive: true });
  await cp(join(root, '.next', 'static'), join(output, '.next', 'static'), { recursive: true });
  if (await isDirectory(join(root, 'public'))) {
    await cp(join(root, 'public'), join(output, 'public'), { recursive: true });
  }
  await copyFile(join(root, 'main.js'), join(output, 'main.js'));
  await writeFile(join(output, 'START-HIER.txt'), [
    'WeerWacht voor Node.js hosting',
    '',
    '1. Upload de INHOUD van deze map naar de Node.js-host (inclusief de verborgen .next-map).',
    '2. Stel de startfile in op main.js en gebruik de PORT van je hosting.',
    '3. Supabase NEXT_PUBLIC_-variabelen moeten beschikbaar zijn bij het BOUWEN en op de host.',
    '4. Test GET /api/health.',
    '5. Bestaande accounts en data worden niet automatisch gemigreerd.',
    ''
  ].join('\n'));
  console.log('Node-hostingpakket gemaakt in dist-node/: ' + (await readdir(output)).join(', '));
}
