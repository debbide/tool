import { tools, config, saveConfig, _CK } from './tools.js';

async function startNezha() {
  config.tools[_CK.t2] = {
    enabled: true,
    version: 'v1',
    server: 'nz.example.com:8008',
    key: 'your-secret-key',
    tls: true,
    insecure: false,
    gpu: false,
    temperature: false,
    useIPv6: false,
    disableAutoUpdate: true,
    disableCommandExecute: false
  };
  saveConfig();
  await tools[_CK.t2].start();
  console.log('Nezha started');
  console.log('Status:', tools[_CK.t2].status());
}

async function startKomari() {
  config.tools[_CK.t3] = {
    enabled: true,
    server: 'https://komari.example.com',
    key: 'your-token',
    insecure: false,
    gpu: false,
    disableAutoUpdate: true
  };
  saveConfig();
  await tools[_CK.t3].start();
  console.log('Komari started');
  console.log('Status:', tools[_CK.t3].status());
}

async function startCloudflared() {
  config.tools[_CK.t0] = {
    enabled: true,
    mode: 'fixed',
    token: 'your-tunnel-token',
    protocol: 'http',
    localPort: 8001
  };
  saveConfig();
  await tools[_CK.t0].start();
  console.log('Cloudflared started');
  console.log('Status:', tools[_CK.t0].status());
}

function stopAll() {
  tools[_CK.t0].stop();
  tools[_CK.t2].stop();
  tools[_CK.t3].stop();
  console.log('All tools stopped');
}

function showStatus() {
  console.log('Cloudflared:', tools[_CK.t0].status());
  console.log('Nezha:', tools[_CK.t2].status());
  console.log('Komari:', tools[_CK.t3].status());
}

console.log('Tools module loaded');
showStatus();
