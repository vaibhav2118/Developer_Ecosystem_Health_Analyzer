const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Helper to log with prefix
function log(service, data) {
  const lines = data.toString().split('\n');
  const color = service === 'Backend' ? '\x1b[36m' : '\x1b[32m'; // Cyan for backend, Green for frontend
  const reset = '\x1b[0m';
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${color}[${service}]${reset} ${line}`);
    }
  });
}

function runCommand(command, args, cwd, serviceName) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd, shell: true });
    
    process.stdout.on('data', (data) => log(serviceName, data));
    process.stderr.on('data', (data) => log(serviceName, data));
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${serviceName} process exited with code ${code}`));
      }
    });
  });
}

async function start() {
  const isWindows = process.platform === 'win32';
  
  console.log('\x1b[35m[Orchestrator] Starting Open Source Ecosystem Intelligence Platform...\x1b[0m\n');

  // 1. Provision Frontend dependencies if missing
  const nodeModulesExist = fs.existsSync(path.join(frontendDir, 'node_modules'));
  if (!nodeModulesExist) {
    console.log('\x1b[35m[Orchestrator] Frontend node_modules not found. Installing dependencies...\x1b[0m');
    execSync('npm install --legacy-peer-deps', { cwd: frontendDir, stdio: 'inherit' });
  }

  // 2. Provision Backend virtual environment if missing
  const venvPath = path.join(backendDir, 'venv');
  const venvExists = fs.existsSync(venvPath);
  if (!venvExists) {
    console.log('\x1b[35m[Orchestrator] Python virtual environment not found. Initializing venv...\x1b[0m');
    execSync('python -m venv venv', { cwd: backendDir, stdio: 'inherit' });
  }

  console.log('\x1b[35m[Orchestrator] Synchronizing backend Python packages...\x1b[0m');
  const pipPath = isWindows ? path.join(venvPath, 'Scripts', 'pip') : path.join(venvPath, 'bin', 'pip');
  execSync(`"${pipPath}" install -r requirements.txt`, { cwd: backendDir, stdio: 'inherit' });

  // 3. Start Backend & Frontend Concurrently
  console.log('\x1b[35m[Orchestrator] Launching services...\x1b[0m\n');

  const pythonExec = isWindows 
    ? path.join(venvPath, 'Scripts', 'python') 
    : path.join(venvPath, 'bin', 'python');
  
  // Launch backend
  const backend = spawn(pythonExec, ['-m', 'uvicorn', 'backend.app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: rootDir,
    shell: true
  });

  // Launch frontend
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    shell: true
  });

  // Pipe stdout and stderr
  backend.stdout.on('data', (data) => log('Backend', data));
  backend.stderr.on('data', (data) => log('Backend', data));

  frontend.stdout.on('data', (data) => log('Frontend', data));
  frontend.stderr.on('data', (data) => log('Frontend', data));

  // Handle termination signals
  const killProcesses = () => {
    console.log('\n\x1b[35m[Orchestrator] Shutting down services...\x1b[0m');
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', killProcesses);
  process.on('SIGTERM', killProcesses);
  
  backend.on('close', (code) => {
    console.log(`\x1b[31m[Backend] Service stopped with exit code ${code}\x1b[0m`);
    killProcesses();
  });

  frontend.on('close', (code) => {
    console.log(`\x1b[31m[Frontend] Service stopped with exit code ${code}\x1b[0m`);
    killProcesses();
  });
}

start().catch(err => {
  console.error('\x1b[31m[Orchestrator] Startup failed:\x1b[0m', err);
  process.exit(1);
});
