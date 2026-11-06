/*
 * WeerWacht Node.js entry point.
 * Accepts the .next/standalone build or a pre-built local checkout.
 */
(async () => {
  const { existsSync } = await import('node:fs');
  const { spawn } = await import('node:child_process');
  const { dirname, join, resolve } = await import('node:path');

  // Compatible with CommonJS and ESM package.json configurations.
  const root = dirname(resolve(process.argv[1] || './main.js'));
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('[WeerWacht] Ongeldige PORT-waarde.');
    process.exitCode = 1;
    return;
  }
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  const standalone = existsSync(join(root, 'server.js'))
    ? join(root, 'server.js')
    : join(root, '.next', 'standalone', 'server.js');
  const nextCli = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  let args;
  let cwd;

  if (existsSync(standalone)) {
    args = [standalone];
    cwd = dirname(standalone);
  } else if (existsSync(nextCli) && existsSync(join(root, '.next', 'BUILD_ID'))) {
    args = [nextCli, 'start', '--hostname', hostname, '--port', String(port)];
    cwd = root;
  } else {
    console.error('[WeerWacht] Productiebuild ontbreekt. Bouw op je pc: pnpm build && pnpm package:node');
    console.error('[WeerWacht] Upload daarna de inhoud van dist-node/ naar je host.');
    process.exitCode = 1;
    return;
  }

  console.log('[WeerWacht] Node.js-productieserver: ' + hostname + ':' + port);
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: hostname },
  });
  child.on('error', error => {
    console.error('[WeerWacht] Server kon niet worden gestart:', error.message);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
  const stop = signal => {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
})().catch(error => {
  console.error('[WeerWacht] Opstartfout:', error);
  process.exitCode = 1;
});
