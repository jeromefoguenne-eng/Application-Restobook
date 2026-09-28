import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage de Restobook Duo (Serveur Cloud + Application Tablettes)...');

// 1. Démarrer le Serveur Cloud / WebSocket (Port 4001)
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'apps', 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Démarrer le Client Web/Tablette (Port 5173)
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'apps', 'client'),
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Arrêt des services Restobook...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
