const { spawn } = require('child_process');
const child = spawn('node', ['server.ts'], { env: { ...process.env, NODE_ENV: 'production' } });
child.stdout.on('data', d => console.log('OUT:', d.toString()));
child.stderr.on('data', d => console.log('ERR:', d.toString()));
setTimeout(() => child.kill(), 3000);
