import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '  PickMyStock: Starting Server & Client Concurrently');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

// Start backend server on port 5000
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: serverDir,
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

// Start frontend client on port 5173
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', '[PickMyStock] Gracefully terminating server and client processes...');
  try {
    if (isWindows) {
      if (server.pid) spawn('taskkill', ['/pid', String(server.pid), '/f', '/t']);
      if (client.pid) spawn('taskkill', ['/pid', String(client.pid), '/f', '/t']);
    } else {
      server.kill('SIGTERM');
      client.kill('SIGTERM');
    }
  } catch {
    // Ignore shutdown errors
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31m[PickMyStock Server] Exited with code ${code}\x1b[0m`);
  }
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31m[PickMyStock Client] Exited with code ${code}\x1b[0m`);
  }
});
