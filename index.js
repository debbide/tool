// Suppress ExperimentalWarning: The Fetch API is an experimental feature
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (name === 'warning' && typeof data === 'object' && data.name === 'ExperimentalWarning' && data.message.includes('Fetch API')) return false;
  return originalEmit.apply(process, [name, data, ...args]);
};

const { spawn, execSync } = require('child_process');
const { createWriteStream, createReadStream, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, chmodSync } = require('fs');
const { join, dirname } = require('path');
// const { fileURLToPath } = require('url'); // Not needed in CJS
const https = require('https');
const http = require('http');
const httpsGet = https.get;
const httpGet = http.get;
const { randomUUID } = require('crypto');
const { createGunzip } = require('zlib');
const { createServer } = require('http');
const net = require('net');

// const __dirname = dirname(fileURLToPath(import.meta.url)); // CJS has built-in __dirname
const ROOT = process.pkg ? dirname(process.execPath) : __dirname;
const DATA_DIR = join(ROOT, 'data');
const BIN_DIR = join(DATA_DIR, 'bin');
const CONFIG_FILE = join(DATA_DIR, 'config.json');
const FILE_MAP_FILE = join(DATA_DIR, 'filemap.dat');
const CERT_FILE = join(DATA_DIR, 'cert.pem');
const KEY_FILE = join(DATA_DIR, 'key.pem');

const _d = (e) => Buffer.from(e, 'base64').toString();
const _CK = {
  t0: _d('Y2xvdWRmbGFyZWQ='),
  t1: _d('eHJheQ=='),
  t2: _d('bmV6aGE='),
  t3: _d('a29tYXJp'),
  p0: _d('dmxlc3M='),
  p1: _d('dm1lc3M='),
  p2: _d('dHJvamFu'),
  p3: _d('c2hhZG93c29ja3M='),
  p4: _d('aHlzdGVyaWEy'),
  p5: _d('dHVpYw==')
};

const _PN = {
  _0: _d('dmxlc3M='),
  _1: _d('dm1lc3M='),
  _2: _d('dHJvamFu'),
  _3: _d('c2hhZG93c29ja3M='),
  _4: _d('aHlzdGVyaWEy'),
  _5: _d('dHVpYw=='),
  _6: _d('ZnJlZWRvbQ=='),
  _7: _d('YmxhY2tob2xl'),
  _8: _d('c3M='),
  d0: _d('VkxFU1M='),
  d1: _d('Vk1lc3M='),
  d2: _d('VHJvamFu'),
  d3: _d('U2hhZG93c29ja3M='),
  d4: _d('SHlzdGVyaWEy'),
  d5: _d('VFVJQw==')
};

const _DP = { _0: '/p0', _1: '/p1', _2: '/p2', _3: '/p3' };

const _KW = {
  pw: _d('cGFzc3dvcmQ='),
  px: _d('cHJveHk='),
  lk: _d('bGluaw=='),
  ul: _d('dXJs'),
  id: _d('dXVpZA==')
};

const _UI = {
  t0: '\u0043\u0046\u0020\u96a7\u9053',
  t1: '\u4ee3\u7406\u8282\u70b9',
  t2: '\u54ea\u5412\u63a2\u9488',
  t3: '\u004b\u006f\u006d\u0061\u0072\u0069'
};

const _DL = {
  cf: _d('aHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2Fk'),
  cf_win: _d('Y2xvdWRmbGFyZWQtd2luZG93cy1hbWQ2NC5leGU='),
  cf_mac: _d('Y2xvdWRmbGFyZWQtZGFyd2luLWFtZDY0LnRneg=='),
  cf_linux: _d('Y2xvdWRmbGFyZWQtbGludXgt'),
  cf_cmd: _d('dHVubmVs'),
  sb_amd: _d('aHR0cHM6Ly9naXRodWIuY29tL2Vvb2NlL3Rlc3QvcmVsZWFzZXMvZG93bmxvYWQvYW1kNjQvc2J4'),
  sb_arm: _d('aHR0cHM6Ly9naXRodWIuY29tL2Vvb2NlL3Rlc3QvcmVsZWFzZXMvZG93bmxvYWQvYXJtNjQvc2J4'),
  nz0: _d('aHR0cHM6Ly9naXRodWIuY29tL25haWJhL25lemhhL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC8='),
  nz1: _d('aHR0cHM6Ly9naXRodWIuY29tL25lemhhaHEvYWdlbnQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkLw=='),
  nz_prefix: _d('bmV6aGEtYWdlbnRf'),
  nz_bin: _d('bmV6aGEtYWdlbnQ='),
  nz_win: _d('d2luZG93c19hbWQ2NC56aXA='),
  nz_mac: _d('ZGFyd2luX2FtZDY0LnppcA=='),
  nz_linux_amd: _d('bGludXhfYW1kNjQuemlw'),
  nz_linux_arm: _d('bGludXhfYXJtNjQuemlw'),
  km: _d('aHR0cHM6Ly9naXRodWIuY29tL2tvbWFyaS1tb25pdG9yL2tvbWFyaS1hZ2VudC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQv'),
  km_prefix: _d('a29tYXJpLWFnZW50LQ=='),
  km_win: _d('d2luZG93cy1hbWQ2NC5leGU='),
  km_mac: _d('ZGFyd2luLWFtZDY0'),
  km_linux: _d('bGludXgt'),
  v2p: _d('djJyYXktcGx1Z2lu')
};

const generateRandomName = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const XOR_KEY = _d('bWluZWJvdC10b29sYm94LXhvci1rZXktMjAyNA==');
const xorEncrypt = (text) => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
  }
  return Buffer.from(result).toString('base64');
};

const xorDecrypt = (encoded) => {
  try {
    const text = Buffer.from(encoded, 'base64').toString();
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
    }
    return result;
  } catch { return ''; }
};

const writeEncryptedConfig = (filePath, content) => {
  try {
    writeFileSync(filePath, xorEncrypt(typeof content === 'string' ? content : JSON.stringify(content)));
  } catch { }
};

const readEncryptedConfig = (filePath) => {
  try {
    return xorDecrypt(readFileSync(filePath, 'utf8'));
  } catch { return null; }
};

let fileMap = {};
const loadFileMap = () => {
  try {
    if (existsSync(FILE_MAP_FILE)) {
      fileMap = JSON.parse(xorDecrypt(readFileSync(FILE_MAP_FILE, 'utf8')));
    }
  } catch { fileMap = {}; }
};

const saveFileMap = () => {
  try {
    writeFileSync(FILE_MAP_FILE, xorEncrypt(JSON.stringify(fileMap)));
  } catch { }
};

const getRandomFileName = (originalName, type = 'bin') => {
  const key = `${type}:${originalName}`;
  if (!fileMap[key]) {
    fileMap[key] = generateRandomName();
    saveFileMap();
  }
  return fileMap[key];
};

const clearRandomFileName = (originalName, type = 'bin') => {
  const key = `${type}:${originalName}`;
  if (fileMap[key]) {
    delete fileMap[key];
    saveFileMap();
  }
};

const getArch = () => {
  const platform = process.platform;
  const arch = process.arch;
  let archName = '';
  if (platform === 'linux') {
    if (arch === 'x64') archName = 'linux-amd64';
    else if (arch === 'arm64') archName = 'linux-arm64';
    else if (arch === 'arm') archName = 'linux-arm';
  } else if (platform === 'darwin') {
    archName = arch === 'arm64' ? 'darwin-arm64' : 'darwin-amd64';
  } else if (platform === 'win32') {
    archName = arch === 'x64' ? 'windows-amd64' : 'windows-386';
  }
  return { platform, arch, archName };
};

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
loadFileMap();

const ensureCert = () => {
  if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) return;
  log('tool', 'info', '\u6b63\u5728\u751f\u6210\u81ea\u7b7e\u540d\u8bc1\u4e66...');
  try {
    const cmd = `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -sha256 -days 3650 -nodes -subj "/CN=${_d('bWluZWJvdC10b29sYm94')}"`;
    try { execSync(cmd, { stdio: 'ignore' }); } catch { execSync(`wsl ${cmd}`, { stdio: 'ignore' }); }
    log('tool', 'success', '\u81ea\u7b7e\u540d\u8bc1\u4e66\u751f\u6210\u6210\u529f');
  } catch (err) {
    log('tool', 'error', `\u751f\u6210\u8bc1\u4e66\u5931\u8d25: ${err.message}`);
  }
};

const findAvailablePort = (startPort = 10000, endPort = 65535) => {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      if (port > endPort) { resolve(0); return; }
      const server = net.createServer();
      server.listen(port, '0.0.0.0', () => { server.close(() => resolve(port)); });
      server.on('error', () => tryPort(port + 1));
    };
    tryPort(startPort);
  });
};

const genS1Cfg = (cfg) => {
  const { port, [_KW.id]: uuid, [_KW.pw]: password, ssMethod, protocols } = cfg;
  const hy2 = cfg[_CK.p4];
  const tuic = cfg[_CK.p5];
  const inbounds = [];


  let wsEnabled = false;
  if (protocols[_CK.p0]?.enabled) {
    const wsPath = protocols[_CK.p0].wsPath || _DP._0;
    inbounds.push({
      type: _PN._0, tag: _PN._0 + '-in', listen: '::', listen_port: port,
      users: [{ uuid: uuid, flow: '' }],
      transport: { type: 'ws', path: wsPath }
    });
    wsEnabled = true;
  }
  if (protocols[_CK.p1]?.enabled) {
    const wsPath = protocols[_CK.p1].wsPath || _DP._1;
    inbounds.push({
      type: _PN._1, tag: _PN._1 + '-in', listen: '::', listen_port: wsEnabled ? port + 1 : port,
      users: [{ uuid: uuid, alterId: 0 }],
      transport: { type: 'ws', path: wsPath }
    });
    if (!wsEnabled) wsEnabled = true;
  }
  if (protocols[_CK.p2]?.enabled) {
    const wsPath = protocols[_CK.p2].wsPath || _DP._2;
    inbounds.push({
      type: _PN._2, tag: _PN._2 + '-in', listen: '::', listen_port: wsEnabled ? port + 2 : port,
      users: [{ [_KW.pw]: password }],
      transport: { type: 'ws', path: wsPath }
    });
    if (!wsEnabled) wsEnabled = true;
  }
  if (protocols[_CK.p3]?.enabled) {
    const wsPath = protocols[_CK.p3].wsPath || _DP._3;
    inbounds.push({
      type: _PN._3, tag: _PN._8 + '-in', listen: '::', listen_port: wsEnabled ? port + 3 : port,
      method: ssMethod || '2022-blake3-aes-256-gcm',
      [_KW.pw]: password,
      transport: { type: 'ws', path: wsPath }
    });
  }
  if (hy2?.enabled && hy2?.port) {
    inbounds.push({
      type: _PN._4, tag: _PN._4 + '-in', listen: '::', listen_port: hy2.port,
      users: [{ [_KW.pw]: password }],
      tls: { enabled: true, certificate_path: CERT_FILE, key_path: KEY_FILE }
    });
  }
  if (tuic?.enabled && tuic?.port) {
    inbounds.push({
      type: _PN._5, tag: _PN._5 + '-in', listen: '::', listen_port: tuic.port,
      users: [{ uuid: uuid, [_KW.pw]: password }],
      congestion_control: 'bbr',
      tls: { enabled: true, alpn: ['h3'], certificate_path: CERT_FILE, key_path: KEY_FILE }
    });
  }
  if (inbounds.length === 0) throw new Error(_d('6K+36Iez5bCR5ZSv55So5LiA5Liq5Y2P6K6u'));
  return {
    log: { level: 'info', timestamp: true },
    inbounds: inbounds,
    outbounds: [{ type: 'direct', tag: 'direct' }, { type: 'block', tag: 'block' }]
  };
};

const genShareLinks = (cfg, host = 'your-domain.com') => {
  const { port, [_KW.id]: uuid, [_KW.pw]: password, ssMethod, protocols } = cfg;
  const u1 = cfg[_CK.p4];
  const tu = cfg[_CK.p5];
  const links = [];
  if (!protocols) return links;
  const tunnelDomain = config.tools[_CK.t0]?.domain || config.tools[_CK.t0]?.tunnelUrl || host;
  const connectAddr = cfg.preferredDomain || tunnelDomain;
  const ispInfo = cfg.ispInfo || 'Unknown';
  const nodeName = cfg.nodeName ? `${cfg.nodeName}-${ispInfo}` : ispInfo;
  if (protocols[_CK.p0]?.enabled) {
    const wsPath = protocols[_CK.p0].wsPath || _DP._0;
    links.push({ name: _PN.d0, protocol: _PN._0, [_KW.lk]: `${_PN._0}://${uuid}@${connectAddr}:443?encryption=none&security=tls&sni=${tunnelDomain}&fp=chrome&type=ws&host=${tunnelDomain}&path=${encodeURIComponent(wsPath)}#${encodeURIComponent(nodeName)}` });
  }
  if (protocols[_CK.p1]?.enabled) {
    const wsPath = protocols[_CK.p1].wsPath || _DP._1;
    const p1Cfg = { v: '2', ps: nodeName, add: connectAddr, port: 443, id: uuid, aid: 0, scy: 'none', net: 'ws', type: 'none', host: tunnelDomain, path: wsPath, tls: 'tls', sni: tunnelDomain, alpn: '', fp: 'chrome' };
    links.push({ name: _PN.d1, protocol: _PN._1, [_KW.lk]: _PN._1 + '://' + Buffer.from(JSON.stringify(p1Cfg)).toString('base64') });
  }
  if (protocols[_CK.p2]?.enabled) {
    const wsPath = protocols[_CK.p2].wsPath || _DP._2;
    links.push({ name: _PN.d2, protocol: _PN._2, [_KW.lk]: `${_PN._2}://${password}@${connectAddr}:443?security=tls&sni=${tunnelDomain}&fp=chrome&type=ws&host=${tunnelDomain}&path=${encodeURIComponent(wsPath)}#${encodeURIComponent(nodeName)}` });
  }
  if (protocols[_CK.p3]?.enabled) {
    const method = ssMethod || 'aes-256-gcm';
    const ssAuth = Buffer.from(`${method}:${password}`).toString('base64');
    links.push({ name: _PN.d3, protocol: _PN._8, [_KW.lk]: `${_PN._8}://${ssAuth}@${connectAddr}:443?plugin=${_DL.v2p}%3Btls%3Bhost%3D${tunnelDomain}%3Bpath%3D${encodeURIComponent(protocols[_CK.p3].wsPath || _DP._3)}#${encodeURIComponent(nodeName)}` });
  }
  if (u1?.enabled) {
    links.push({ name: _PN.d4, protocol: _PN._4, [_KW.lk]: `${_PN._4}://${password}@${host}:${u1.port || 20000}/?insecure=1&sni=${tunnelDomain}#${encodeURIComponent(nodeName)}` });
  }
  if (tu?.enabled) {
    links.push({ name: _PN.d5, protocol: _PN._5, [_KW.lk]: `${_PN._5}://${uuid}:${password}@${host}:${tu.port || 30000}/?congestion_control=bbr&alpn=h3&allow_insecure=1&sni=${tunnelDomain}#${encodeURIComponent(nodeName)}` });
  }
  return links;
};

const defaultConfig = {
  port: 3097,
  auth: { username: 'admin', [_KW.pw]: 'admin123' },
  logs: {
    enabled: true,
    maxLines: 500,
    logTools: true,
    logBots: true,
    logApi: false
  },
  tools: {
    [_CK.t0]: { enabled: false, mode: 'fixed', token: '', domain: '', protocol: 'http', localPort: 8001, autoStart: false },
    [_CK.t1]: {
      enabled: false, autoStart: false, mode: 'auto', port: 8001,
      [_KW.id]: '', [_KW.pw]: '', ssMethod: 'aes-256-gcm',
      useCF: false, preferredDomain: '',
      protocols: {
        [_CK.p0]: { enabled: false, wsPath: _DP._0 },
        [_CK.p1]: { enabled: false, wsPath: _DP._1 },
        [_CK.p2]: { enabled: false, wsPath: _DP._2 },
        [_CK.p3]: { enabled: false, wsPath: _DP._3 }
      },
      [_CK.p4]: { enabled: false, port: 0 },
      [_CK.p5]: { enabled: false, port: 0 },
      config: ''
    },
    [_CK.t2]: { enabled: false, version: 'v1', server: '', key: '', tls: true, insecure: false, gpu: false, temperature: false, useIPv6: false, disableAutoUpdate: true, disableCommandExecute: false, autoStart: false },
    [_CK.t3]: { enabled: false, server: '', key: '', insecure: false, gpu: false, disableAutoUpdate: true, autoStart: false }
  }
};

let config = { ...defaultConfig };
try {
  if (existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(xorDecrypt(readFileSync(CONFIG_FILE, 'utf8')));
    config = { ...defaultConfig, ...saved, tools: { ...defaultConfig.tools, ...saved.tools }, auth: { ...defaultConfig.auth, ...saved.auth }, logs: { ...defaultConfig.logs, ...saved.logs } };
  }
} catch { }

const saveConfig = () => {
  try {
    writeFileSync(CONFIG_FILE, xorEncrypt(JSON.stringify(config)));
  } catch { }
};

const logs = [];
const log = (category, level, msg) => {
  if (!config.logs?.enabled) return;
  if (category === 'tool' && !config.logs?.logTools) return;
  if (category === 'bot' && !config.logs?.logBots) return;
  if (category === 'api' && !config.logs?.logApi) return;
  const entry = { time: new Date().toISOString(), type: category, level, msg };
  logs.push(entry);
  while (logs.length > (config.logs?.maxLines || 500)) logs.shift();
  broadcast('log', entry);
};

const pids = {};

const stopToolProcess = (name) => {
  if (pids[name]) {
    try { pids[name].kill('SIGTERM'); } catch { }
    pids[name] = null;
  }
};

const startToolProcess = (name, binPath, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    stopToolProcess(name);
    const proc = spawn(binPath, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    pids[name] = proc;
    proc.stdout?.on('data', d => {
      const msg = d.toString().trim();
      if (config.logs?.enabled && config.logs?.logTools) {
        if (name === _CK.t0 && msg.includes('INF')) return;
        log('tool', 'info', `[${name}] ${msg}`);
      }
    });
    proc.stderr?.on('data', d => log('tool', 'info', `[${name}] ${d.toString().trim()}`));

    let started = false;
    proc.on('error', err => {
      if (!started) {
        pids[name] = null;
        reject(err);
      }
    });
    proc.on('exit', code => {
      pids[name] = null;
      if (!started) {
        reject(new Error(`Process exited early with code ${code}`));
      }
    });
    setTimeout(() => {
      if (pids[name]) {
        started = true;
        resolve();
      }
    }, 1000);
  });
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const get = url.startsWith('https') ? httpsGet : httpGet;
    get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { file.close(); reject(err); });
  });
};

const unzip = (src, dest) => {
  return new Promise((resolve, reject) => {
    const input = createReadStream(src);
    const output = createWriteStream(dest);
    input.pipe(createGunzip()).pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
  });
};

const tools = {
  [_CK.t0]: {
    status: () => ({
      installed: existsSync(join(BIN_DIR, getRandomFileName(_CK.t0, 'bin'))),
      running: !!pids[_CK.t0],
      config: config.tools[_CK.t0]
    }),
    install: async () => {
      const arch = getArch();
      let url, ext = '';
      if (arch.platform === 'win32') {
        url = `${_DL.cf}/${_DL.cf_win}`;
        ext = '.exe';
      } else if (arch.platform === 'darwin') {
        url = `${_DL.cf}/${_DL.cf_mac}`;
      } else {
        url = `${_DL.cf}/${_DL.cf_linux}${arch.arch === 'arm64' ? 'arm64' : 'amd64'}`;
      }
      const binName = getRandomFileName(_CK.t0, 'bin') + ext;
      const binPath = join(BIN_DIR, binName);
      if (url.endsWith('.tgz')) {
        const tmp = join(BIN_DIR, 'cf.tgz');
        await downloadFile(url, tmp);
        await unzip(tmp, binPath);
        rmSync(tmp, { force: true });
      } else {
        await downloadFile(url, binPath);
      }
      if (arch.platform !== 'win32') chmodSync(binPath, 0o755);
      log('tool', 'info', `[${_CK.t0}] \u5b89\u88c5\u5b8c\u6210`);
    },
    start: async () => {
      const cfg = config.tools[_CK.t0];
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t0, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (!existsSync(binPath)) {
        log('tool', 'info', `[${_CK.t0}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await tools[_CK.t0].install();
      }
      let args = [];
      if (cfg.mode === 'quick') {
        args = [_DL.cf_cmd, '--url', `${cfg.protocol || 'http'}://localhost:${cfg.localPort || 8001}`];
      } else {
        const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t0, 'cfg'));
        writeEncryptedConfig(cfgPath, cfg.token);
        const decryptedToken = readEncryptedConfig(cfgPath);
        args = [_DL.cf_cmd, '--no-autoupdate', 'run', '--token', decryptedToken];
      }
      await startToolProcess(_CK.t0, binPath, args);
      config.tools[_CK.t0].enabled = true;
      saveConfig();
      log('tool', 'info', `[${_CK.t0}] \u5df2\u542f\u52a8`);
      if (config.tools[_CK.t0].autoDelete) {
        log('tool', 'info', `[${_CK.t0}] 60\u79d2\u540e\u81ea\u52a8\u5220\u9664\u4e8c\u8fdb\u5236\u6587\u4ef6`);
        setTimeout(() => tools[_CK.t0].deleteBin(), 60000);
      }
    },
    stop: () => {
      stopToolProcess(_CK.t0);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t0, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t0, 'cfg'));
      setTimeout(() => {
        try { rmSync(binPath, { force: true }); } catch { }
        try { rmSync(cfgPath, { force: true }); } catch { }
      }, 1000);
      config.tools[_CK.t0].enabled = false;
      saveConfig();
      log('tool', 'info', `[${_CK.t0}] \u5df2\u505c\u6b62`);
    },
    restart: async function () { this.stop(); await this.start(); },
    deleteBin: () => {
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t0, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      log('tool', 'info', `[${_CK.t0}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u5df2\u5220\u9664`);
    },
    delete: () => {
      stopToolProcess(_CK.t0);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t0, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t0, 'cfg'));
      if (existsSync(cfgPath)) rmSync(cfgPath, { force: true });
      clearRandomFileName(_CK.t0, 'bin');
      clearRandomFileName(_CK.t0, 'cfg');
      log('tool', 'info', `[${_CK.t0}] \u5df2\u5220\u9664`);
    }
  },
  [_CK.t1]: {
    bin: () => join(BIN_DIR, getRandomFileName(_CK.t1, 'bin')),
    cfg: () => join(DATA_DIR, getRandomFileName(_CK.t1, 'cfg') + '.json'),
    status: () => {
      const s1Cfg = config.tools[_CK.t1];
      return {
        installed: existsSync(tools[_CK.t1].bin()),
        running: !!pids[_CK.t1],
        shareLinks: s1Cfg[_KW.id] ? genShareLinks(s1Cfg, s1Cfg.publicIp) : [],
        collection: s1Cfg[_KW.id] ? Buffer.from(genShareLinks(s1Cfg, s1Cfg.publicIp).map(l => l[_KW.lk]).join('\n')).toString('base64') : '',
        config: config.tools[_CK.t1]
      };
    },
    install: async () => {
      const arch = getArch();
      if (arch.platform !== 'linux') throw new Error('\u4ec5\u652f\u6301 Linux');
      const url = arch.arch === 'arm64' ? _DL.sb_arm : _DL.sb_amd;
      await downloadFile(url, tools[_CK.t1].bin());
      chmodSync(tools[_CK.t1].bin(), 0o755);
      log('tool', 'info', `[${_CK.t1}] \u5b89\u88c5\u5b8c\u6210`);
    },
    start: async () => {
      const s1Cfg = config.tools[_CK.t1];
      if (!s1Cfg[_KW.id]) { config.tools[_CK.t1][_KW.id] = randomUUID(); saveConfig(); }
      if (!s1Cfg[_KW.pw]) { config.tools[_CK.t1][_KW.pw] = randomUUID().replace(/-/g, '').slice(0, 16); saveConfig(); }
      const hasEnabledProtocol = Object.values(s1Cfg.protocols || {}).some(p => p?.enabled) || s1Cfg[_CK.p4]?.enabled || s1Cfg[_CK.p5]?.enabled;
      if (!hasEnabledProtocol) throw new Error('\u8bf7\u81f3\u5c11\u542f\u7528\u4e00\u4e2a\u534f\u8bae');
      if (!existsSync(tools[_CK.t1].bin())) {
        log('tool', 'info', `[${_CK.t1}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await tools[_CK.t1].install();
      }
      if (s1Cfg[_CK.p4]?.enabled || s1Cfg[_CK.p5]?.enabled) {
        ensureCert();
        if (s1Cfg[_CK.p4]?.enabled && !s1Cfg[_CK.p4].port) {
          config.tools[_CK.t1][_CK.p4].port = await findAvailablePort(20000);
          saveConfig();
        }
        if (s1Cfg[_CK.p5]?.enabled && !s1Cfg[_CK.p5].port) {
          config.tools[_CK.t1][_CK.p5].port = await findAvailablePort(30000);
          saveConfig();
        }
      }
      const genConfig = genS1Cfg(config.tools[_CK.t1]);
      writeEncryptedConfig(tools[_CK.t1].cfg(), JSON.stringify(genConfig, null, 2));
      const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t1 + '-plain', 'cfg') + '.json');
      writeFileSync(plainCfg, readEncryptedConfig(tools[_CK.t1].cfg()));
      await startToolProcess(_CK.t1, tools[_CK.t1].bin(), ['run', '-c', plainCfg]);
      setTimeout(() => { try { rmSync(plainCfg, { force: true }); } catch { } }, 2000);
      if (s1Cfg.useCF && !pids[_CK.t0]) {
        const t0Cfg = config.tools[_CK.t0];
        if (t0Cfg.mode === 'fixed' && t0Cfg.token) {
          config.tools[_CK.t0].enabled = true;
          saveConfig();
          await tools[_CK.t0].start();
        } else if (t0Cfg.mode !== 'fixed') {
          config.tools[_CK.t0].mode = 'quick';
          config.tools[_CK.t0].localPort = s1Cfg.port;
          config.tools[_CK.t0].protocol = 'http';
          config.tools[_CK.t0].enabled = true;
          saveConfig();
          await tools[_CK.t0].start();
        }
      }
      (async () => {
        try {
          const res1 = await fetch(_d('aHR0cHM6Ly9hcGkuaXAuc2IvZ2VvaXA='), { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const data1 = await res1.json();
          if (data1.country_code && data1.ip) {
            config.tools[_CK.t1].ispInfo = `${data1.country_code}_${(data1.isp || 'Unknown').replace(/ /g, '_')}`;
            config.tools[_CK.t1].publicIp = data1.ip;
            saveConfig(); return;
          }
        } catch { }
        try {
          const res2 = await fetch(_d('aHR0cHM6Ly9pcGFwaS5jby9qc29uLw=='), { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const data2 = await res2.json();
          if (data2.country_code && data2.ip) {
            config.tools[_CK.t1].ispInfo = `${data2.country_code}_${(data2.org || 'Unknown').replace(/ /g, '_')}`;
            config.tools[_CK.t1].publicIp = data2.ip;
            saveConfig(); return;
          }
        } catch { }
        try {
          const res3 = await fetch(_d('aHR0cDovL2lwLWFwaS5jb20vanNvbi8='));
          const data3 = await res3.json();
          if (data3.status === 'success' && data3.countryCode && data3.query) {
            config.tools[_CK.t1].ispInfo = `${data3.countryCode}_${(data3.org || data3.isp || 'Unknown').replace(/ /g, '_')}`;
            config.tools[_CK.t1].publicIp = data3.query;
            saveConfig();
          }
        } catch { }
      })();
      config.tools[_CK.t1].enabled = true;
      saveConfig();
      log('tool', 'info', `[${_CK.t1}] \u5df2\u542f\u52a8`);
      if (config.tools[_CK.t1].autoDelete) {
        log('tool', 'info', `[${_CK.t1}] 60\u79d2\u540e\u81ea\u52a8\u5220\u9664\u4e8c\u8fdb\u5236\u6587\u4ef6`);
        setTimeout(() => tools[_CK.t1].deleteBin(), 60000);
      }
    },
    stop: () => {
      stopToolProcess(_CK.t1);
      config.tools[_CK.t1].enabled = false;
      saveConfig();
      if (config.tools[_CK.t1].useCF && pids[_CK.t0]) tools[_CK.t0].stop();
      log('tool', 'info', `[${_CK.t1}] \u5df2\u505c\u6b62`);
    },
    restart: async function () { this.stop(); await new Promise(r => setTimeout(r, 500)); await this.start(); },
    deleteBin: () => {
      if (existsSync(tools[_CK.t1].bin())) rmSync(tools[_CK.t1].bin(), { force: true });
      log('tool', 'info', `[${_CK.t1}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u5df2\u5220\u9664`);
    },
    delete: () => {
      tools[_CK.t1].stop();
      [tools[_CK.t1].bin(), tools[_CK.t1].cfg(), CERT_FILE, KEY_FILE].forEach(f => { try { rmSync(f, { force: true }); } catch { } });
      clearRandomFileName(_CK.t1, 'bin');
      clearRandomFileName(_CK.t1, 'cfg');
      clearRandomFileName(_CK.t1 + '-plain', 'cfg');
      config.tools[_CK.t1] = { ...defaultConfig.tools[_CK.t1] };
      saveConfig();
      log('tool', 'info', `[${_CK.t1}] \u5df2\u5220\u9664`);
    }
  },
  [_CK.t2]: {
    status: () => ({
      installed: existsSync(join(BIN_DIR, getRandomFileName(_CK.t2, 'bin'))),
      running: !!pids[_CK.t2],
      config: config.tools[_CK.t2]
    }),
    install: async () => {
      const arch = getArch();
      const version = config.tools[_CK.t2].version || 'v1';
      let url;
      const suffix = arch.platform === 'win32' ? _DL.nz_win : (arch.platform === 'darwin' ? _DL.nz_mac : (arch.arch === 'arm64' ? _DL.nz_linux_arm : _DL.nz_linux_amd));
      if (version === 'v0') {
        url = `${_DL.nz0}${_DL.nz_prefix}${suffix}`;
      } else {
        url = `${_DL.nz1}${_DL.nz_prefix}${suffix}`;
      }
      const binName = getRandomFileName(_CK.t2, 'bin') + (process.platform === 'win32' ? '.exe' : '');
      const binPath = join(BIN_DIR, binName);
      const tmpFile = join(BIN_DIR, 'nz_tmp.zip');
      await downloadFile(url, tmpFile);
      if (url.endsWith('.zip')) {
        execSync(`unzip -o "${tmpFile}" -d "${BIN_DIR}"`, { stdio: 'ignore' });
        const extracted = join(BIN_DIR, _DL.nz_bin);
        if (existsSync(extracted)) {
          if (existsSync(binPath)) rmSync(binPath, { force: true });
          execSync(`mv "${extracted}" "${binPath}"`, { stdio: 'ignore' });
        }
      } else if (url.endsWith('.tar.gz')) {
        execSync(`tar -xzf "${tmpFile}" -C "${BIN_DIR}"`, { stdio: 'ignore' });
        const extracted = join(BIN_DIR, _DL.nz_bin);
        if (existsSync(extracted)) {
          if (existsSync(binPath)) rmSync(binPath, { force: true });
          execSync(`mv "${extracted}" "${binPath}"`, { stdio: 'ignore' });
        }
      }
      rmSync(tmpFile, { force: true });
      if (process.platform !== 'win32') chmodSync(binPath, 0o755);
      log('tool', 'info', `[${_CK.t2}] \u5b89\u88c5\u5b8c\u6210`);
    },
    start: async () => {
      const cfg = config.tools[_CK.t2];
      if (!cfg.server || !cfg.key) throw new Error('\u8bf7\u5148\u914d\u7f6e\u670d\u52a1\u5668\u548c\u5bc6\u94a5');
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t2, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (!existsSync(binPath)) {
        log('tool', 'info', `[${_CK.t2}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await tools[_CK.t2].install();
      }
      let args = [];
      if (cfg.version === 'v0') {
        args = ['-s', cfg.server, '-p', cfg.key];
        if (cfg.tls) args.push('--tls');
      } else {
        const uuid = cfg[_KW.id] || randomUUID();
        if (!cfg[_KW.id]) { config.tools[_CK.t2][_KW.id] = uuid; saveConfig(); }
        let serverAddr = cfg.server;
        let useTls = true;
        if (serverAddr.startsWith('https://')) {
          serverAddr = serverAddr.replace('https://', '');
          useTls = true;
        } else if (serverAddr.startsWith('http://')) {
          serverAddr = serverAddr.replace('http://', '');
          useTls = false;
        }
        if (!serverAddr.includes(':')) {
          serverAddr += useTls ? ':443' : ':80';
        }
        const nzCfgFile = join(DATA_DIR, getRandomFileName(_CK.t2, 'cfg') + '.yaml');
        const nzCfgContent = [
          `client_secret: ${cfg.key}`,
          `debug: true`,
          `disable_auto_update: ${cfg.disableAutoUpdate !== false}`,
          `disable_command_execute: ${cfg.disableCommandExecute || false}`,
          `disable_force_update: true`,
          `disable_nat: false`,
          `disable_send_query: false`,
          `gpu: ${cfg.gpu || false}`,
          `insecure_tls: ${cfg.insecure || false}`,
          `ip_report_period: 1800`,
          `report_delay: 1`,
          `self_update_period: 0`,
          `server: ${serverAddr}`,
          `skip_connection_count: false`,
          `skip_procs_count: false`,
          `temperature: ${cfg.temperature || false}`,
          `tls: ${useTls}`,
          `use_gitee_to_upgrade: false`,
          `use_ipv6_country_code: ${cfg.useIPv6 || false}`,
          `uuid: ${uuid}`
        ].join('\n');
        writeEncryptedConfig(nzCfgFile, nzCfgContent);
        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t2 + '-plain', 'cfg') + '.yaml');
        writeFileSync(plainCfg, readEncryptedConfig(nzCfgFile));
        args = ['-c', plainCfg];
      }
      await startToolProcess(_CK.t2, binPath, args);
      if (args[0] === '-c') {
        const plainCfg = args[1];
        setTimeout(() => { try { rmSync(plainCfg, { force: true }); } catch { } }, 2000);
      }
      config.tools[_CK.t2].enabled = true;
      saveConfig();
      log('tool', 'info', `[${_CK.t2}] \u5df2\u542f\u52a8`);
      if (config.tools[_CK.t2].autoDelete) {
        log('tool', 'info', `[${_CK.t2}] 60\u79d2\u540e\u81ea\u52a8\u5220\u9664\u4e8c\u8fdb\u5236\u6587\u4ef6`);
        setTimeout(() => tools[_CK.t2].deleteBin(), 60000);
      }
    },
    stop: () => {
      stopToolProcess(_CK.t2);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t2, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t2, 'cfg') + '.yaml');
      setTimeout(() => {
        try { rmSync(binPath, { force: true }); } catch { }
        try { rmSync(cfgPath, { force: true }); } catch { }
        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t2 + '-plain', 'cfg') + '.yaml');
        try { rmSync(plainCfg, { force: true }); } catch { }
      }, 1000);
      config.tools[_CK.t2].enabled = false;
      saveConfig();
      log('tool', 'info', `[${_CK.t2}] \u5df2\u505c\u6b62`);
    },
    restart: async function () { this.stop(); await this.start(); },
    deleteBin: () => {
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t2, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      log('tool', 'info', `[${_CK.t2}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u5df2\u5220\u9664`);
    },
    delete: () => {
      stopToolProcess(_CK.t2);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t2, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t2, 'cfg') + '.yaml');
      if (existsSync(cfgPath)) rmSync(cfgPath, { force: true });
      const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t2 + '-plain', 'cfg') + '.yaml');
      if (existsSync(plainCfg)) rmSync(plainCfg, { force: true });
      clearRandomFileName(_CK.t2, 'bin');
      clearRandomFileName(_CK.t2, 'cfg');
      clearRandomFileName(_CK.t2 + '-plain', 'cfg');
      log('tool', 'info', `[${_CK.t2}] \u5df2\u5220\u9664`);
    }
  },
  [_CK.t3]: {
    status: () => ({
      installed: existsSync(join(BIN_DIR, getRandomFileName(_CK.t3, 'bin'))),
      running: !!pids[_CK.t3],
      config: config.tools[_CK.t3]
    }),
    install: async () => {
      const arch = getArch();
      const suffix = arch.platform === 'win32' ? _DL.km_win : (arch.platform === 'darwin' ? _DL.km_mac : `${_DL.km_linux}${arch.arch === 'arm64' ? 'arm64' : 'amd64'}`);
      const url = `${_DL.km}${_DL.km_prefix}${suffix}`;
      const binName = getRandomFileName(_CK.t3, 'bin') + (process.platform === 'win32' ? '.exe' : '');
      const binPath = join(BIN_DIR, binName);
      await downloadFile(url, binPath);
      if (process.platform !== 'win32') chmodSync(binPath, 0o755);
      log('tool', 'info', `[${_CK.t3}] \u5b89\u88c5\u5b8c\u6210`);
    },
    start: async () => {
      const cfg = config.tools[_CK.t3];
      if (!cfg.server || !cfg.key) throw new Error('\u8bf7\u5148\u914d\u7f6e\u670d\u52a1\u5668\u548c\u5bc6\u94a5');
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t3, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (!existsSync(binPath)) {
        log('tool', 'info', `[${_CK.t3}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await tools[_CK.t3].install();
      }
      const s3Cfg = { endpoint: cfg.server, token: cfg.key, ignore_unsafe_cert: cfg.insecure || false, gpu: cfg.gpu || false, disable_auto_update: cfg.disableAutoUpdate !== false };
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t3, 'cfg') + '.yaml');
      writeEncryptedConfig(cfgPath, JSON.stringify(s3Cfg, null, 2));
      const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t3 + '-plain', 'cfg') + '.json');
      writeFileSync(plainCfg, readEncryptedConfig(cfgPath));
      await startToolProcess(_CK.t3, binPath, ['--config', plainCfg]);
      setTimeout(() => { try { rmSync(plainCfg, { force: true }); } catch { } }, 2000);
      config.tools[_CK.t3].enabled = true;
      saveConfig();
      log('tool', 'info', `[${_CK.t3}] \u5df2\u542f\u52a8`);
      if (config.tools[_CK.t3].autoDelete) {
        log('tool', 'info', `[${_CK.t3}] 60\u79d2\u540e\u81ea\u52a8\u5220\u9664\u4e8c\u8fdb\u5236\u6587\u4ef6`);
        setTimeout(() => tools[_CK.t3].deleteBin(), 60000);
      }
    },
    stop: () => {
      stopToolProcess(_CK.t3);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t3, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t3, 'cfg') + '.yaml');
      setTimeout(() => {
        try { rmSync(binPath, { force: true }); } catch { }
        try { rmSync(cfgPath, { force: true }); } catch { }
        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t3 + '-plain', 'cfg') + '.json');
        try { rmSync(plainCfg, { force: true }); } catch { }
      }, 1000);
      config.tools[_CK.t3].enabled = false;
      saveConfig();
      log('tool', 'info', `[${_CK.t3}] \u5df2\u505c\u6b62`);
    },
    restart: async function () { this.stop(); await this.start(); },
    deleteBin: () => {
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t3, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      log('tool', 'info', `[${_CK.t3}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u5df2\u5220\u9664`);
    },
    delete: () => {
      stopToolProcess(_CK.t3);
      const binPath = join(BIN_DIR, getRandomFileName(_CK.t3, 'bin') + (process.platform === 'win32' ? '.exe' : ''));
      if (existsSync(binPath)) rmSync(binPath, { force: true });
      const cfgPath = join(DATA_DIR, getRandomFileName(_CK.t3, 'cfg') + '.yaml');
      if (existsSync(cfgPath)) rmSync(cfgPath, { force: true });
      const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t3 + '-plain', 'cfg') + '.json');
      if (existsSync(plainCfg)) rmSync(plainCfg, { force: true });
      clearRandomFileName(_CK.t3, 'bin');
      clearRandomFileName(_CK.t3, 'cfg');
      clearRandomFileName(_CK.t3 + '-plain', 'cfg');
      log('tool', 'info', `[${_CK.t3}] \u5df2\u5220\u9664`);
    }
  }
};

const tokens = new Map();
const createToken = (username) => {
  const token = randomUUID();
  tokens.set(token, { username, created: Date.now() });
  return token;
};
const verifyToken = (token) => {
  if (!token) return false;
  const data = tokens.get(token);
  if (!data) return false;
  if (Date.now() - data.created > 24 * 60 * 60 * 1000) {
    tokens.delete(token);
    return false;
  }
  return true;
};

const clients = new Set();
const broadcast = (type, data) => {
  const msg = JSON.stringify({ type, data });
  clients.forEach(c => c.readyState === 1 && c.send(msg));
};

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tools Standalone</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --primary: #5eead4;
      --success: #22c55e;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; margin-bottom: 10px; color: var(--primary); }
    .subtitle { text-align: center; color: var(--muted); margin-bottom: 30px; font-size: 14px; }
    .card {
      background: rgba(42, 58, 66, 0.5);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      border: 1px solid rgba(94, 234, 212, 0.2);
    }
    .card:hover { border-color: rgba(94, 234, 212, 0.5); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot.online { background: var(--primary); box-shadow: 0 0 10px rgba(94, 234, 212, 0.5); }
    .dot.offline { background: var(--muted); }
    .dot.installed { background: var(--warning); }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-primary { background: var(--primary); color: #000; }
    .btn-success { background: var(--success); color: #fff; }
    .btn-warning { background: var(--warning); color: #000; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; margin-bottom: 4px; font-size: 14px; color: var(--muted); }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--primary); }
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .login-page { display: none; position: fixed; inset: 0; background: var(--bg); z-index: 1000; justify-content: center; align-items: center; }
    .login-page.active { display: flex; }
    .login-card { background: var(--card); padding: 40px; border-radius: 16px; width: 100%; max-width: 400px; }
    .login-card h1 { margin-bottom: 30px; }
    .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; background: var(--success); color: #fff; z-index: 9999; animation: slideIn 0.3s; }
    .toast.error { background: var(--danger); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .logs { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 20px; }
    .log-entry { padding: 2px 0; border-bottom: 1px solid var(--border); }
    .log-entry:last-child { border-bottom: none; }
    .tab-bar { display: flex; gap: 10px; margin-bottom: 20px; }
    .tab-btn { background: var(--card); border: 1px solid var(--border); color: var(--muted); padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
    .tab-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
    .tab-btn:hover:not(.active) { border-color: var(--primary); color: var(--text); }
  </style>
</head>
<body>
  <div class="login-page" id="loginPage">
    <div class="login-card">
      <h1>Tools Standalone</h1>
      <div class="form-group"><label>\u7528\u6237\u540d</label><input id="loginUser" value="admin" onkeydown="if(event.key==='Enter')login()"></div>
      <div class="form-group"><label>\u5bc6\u7801</label><input type="password" id="loginPass" onkeydown="if(event.key==='Enter')login()"></div>
      <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="login()">\u767b \u5f55</button>
    </div>
  </div>
  <div class="container" id="app" style="display:none"></div>
  <script>
    let token = localStorage.getItem('token') || '';
    let toolsData = {};
    let logsConfig = {};
    let activeTab = 'tools';

    const switchTab = (tab) => {
      activeTab = tab;
      render();
    };


    const api = async (path, method = 'GET', body = null) => {
      const opts = { method, headers: { 'Authorization': 'Bearer ' + token } };
      if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      const res = await fetch('/api' + path, opts);
      if (res.status === 401) { token = ''; localStorage.removeItem('token'); checkAuth(); throw new Error('\u672a\u6388\u6743'); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    };

    const toast = (msg, type = 'success') => {
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };

    const checkAuth = async () => {
      if (!token) {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('app').style.display = 'none';
        return;
      }
      try {
        await api('/auth/check');
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('app').style.display = 'block';
        render();
      } catch {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('app').style.display = 'none';
      }
    };

    window.login = async () => {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: document.getElementById('loginUser').value, ['${_KW.pw}']: document.getElementById('loginPass').value })
        });
        const data = await res.json();
        if (data.success) {
          token = data.token;
          localStorage.setItem('token', token);
          checkAuth();
        } else {
          toast(data.error, 'error');
        }
      } catch (e) {
        toast('\u767b\u5f55\u5931\u8d25', 'error');
      }
    };

    const render = async () => {
      try {
        const res = await api('/tools');
        toolsData = res.tools;
        logsConfig = res.logs || {};
        const toolNames = { '${_CK.t0}': '${_UI.t0}', '${_CK.t1}': '${_UI.t1}', '${_CK.t2}': '${_UI.t2}', '${_CK.t3}': '${_UI.t3}' };


        const appHtml = \`
          <h1>Tools Standalone</h1>
          <p class="subtitle">\${res.arch.platform} / \${res.arch.archName}</p>
          <div class="tab-bar">
            <button class="tab-btn \${activeTab === 'tools' ? 'active' : ''}" onclick="switchTab('tools')">\u5de5\u5177</button>
            <button class="tab-btn \${activeTab === 'system' ? 'active' : ''}" onclick="switchTab('system')">\u7cfb\u7edf</button>
          </div>
          <div id="tab-tools" style="display:\${activeTab === 'tools' ? 'block' : 'none'}">
          \${Object.entries(toolsData).map(([name, t]) => \`

            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <span class="dot \${t.running ? 'online' : (t.installed ? 'installed' : 'offline')}"></span>
                  \${toolNames[name]}
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer" title="\u5f00\u673a\u81ea\u52a8\u542f\u52a8">
                    <input type="checkbox" id="\${name}-autostart" \${t.config?.autoStart ? 'checked' : ''} onchange="toggleAutoStart('\${name}')"> \u81ea\u542f
                  </label>
                  <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer" title="\u542f\u52a8\u540e60\u79d2\u81ea\u52a8\u5220\u9664\u4e8c\u8fdb\u5236">
                    <input type="checkbox" id="\${name}-autodel" \${t.config?.autoDelete ? 'checked' : ''} onchange="saveConfig('\${name}')"> \u5220\u6587\u4ef6
                  </label>
                  <span style="font-size:12px;color:var(--muted)">\${t.running ? '\u8fd0\u884c\u4e2d' : (t.installed ? '\u5df2\u5b89\u88c5' : '\u672a\u5b89\u88c5')}</span>
                </div>
              </div>
              \${name === '${_CK.t0}' ? \`
                <div class="form-group">
                  <label>\u96a7\u9053\u6a21\u5f0f</label>
                  <select id="t0-mode" onchange="toggleT0Mode()">
                    <option value="fixed" \${t.config?.mode !== 'quick' ? 'selected' : ''}>\u56fa\u5b9a\u96a7\u9053 (Token)</option>
                    <option value="quick" \${t.config?.mode === 'quick' ? 'selected' : ''}>\u4e34\u65f6\u96a7\u9053 (Quick)</option>
                  </select>
                </div>
                <div id="t0-fixed" style="display:\${t.config?.mode !== 'quick' ? 'block' : 'none'}">
                  <div class="form-group"><label>Token</label><input id="t0-token" value="\${t.config?.token || ''}" placeholder="${_d('Q2xvdWRmbGFyZSBUdW5uZWwgVG9rZW4=')}"></div>
                  <div class="form-group"><label>\u96a7\u9053\u57df\u540d</label><input id="t0-domain" value="\${t.config?.domain || ''}" placeholder="\u4f8b\u5982: example.trycloudflare.com"></div>
                </div>
                <div id="t0-quick" style="display:\${t.config?.mode === 'quick' ? 'block' : 'none'}">
                  <div class="form-row">
                    <div class="form-group"><label>\u534f\u8bae</label><select id="t0-protocol"><option value="http" \${t.config?.protocol !== 'https' ? 'selected' : ''}>HTTP</option><option value="https" \${t.config?.protocol === 'https' ? 'selected' : ''}>HTTPS</option></select></div>
                    <div class="form-group"><label>\u672c\u5730\u7aef\u53e3</label><input type="number" id="t0-port" value="\${t.config?.localPort || 8001}"></div>
                  </div>
                </div>
              \` : ''}
              \${name === '${_CK.t1}' ? \`
                <div class="form-row">
                  <div class="form-group"><label>\u76d1\u542c\u7aef\u53e3</label><input type="number" id="t1-port" value="\${t.config?.port || 8001}"></div>
                  <div class="form-group"><label>\u9996\u9009\u57df\u540d</label><input id="t1-domain" value="\${t.config?.preferredDomain || ''}" placeholder="\u7559\u7a7a\u4f7f\u7528\u96a7\u9053\u57df\u540d"></div>
                </div>
                <div class="form-group">
                   <label>UUID (\u4ee3\u7406\u9274\u6743)</label>
                   <div style="display:flex;gap:8px">
                     <input id="t1-uuid" value="\${t.config?.['${_KW.id}'] || ''}" placeholder="\u7559\u7a7a\u81ea\u52a8\u751f\u6210">
                     <button class="btn btn-primary btn-sm" onclick="document.getElementById('t1-uuid').value = genUUID()">\u968f\u673a</button>
                   </div>
                </div>
                <div class="form-group" style="display:flex;flex-wrap:wrap;gap:15px">
                  <label><input type="checkbox" id="t1-p0" \${t.config?.protocols?.['${_CK.p0}']?.enabled ? 'checked' : ''}> ${_PN.d0}</label>
                  <label><input type="checkbox" id="t1-p1" \${t.config?.protocols?.['${_CK.p1}']?.enabled ? 'checked' : ''}> ${_PN.d1}</label>
                  <label><input type="checkbox" id="t1-p2" \${t.config?.protocols?.['${_CK.p2}']?.enabled ? 'checked' : ''}> ${_PN.d2}</label>
                  <label><input type="checkbox" id="t1-p3" \${t.config?.protocols?.['${_CK.p3}']?.enabled ? 'checked' : ''}> ${_PN.d3}</label>
                  <div style="display:flex;align-items:center;gap:4px">
                    <label><input type="checkbox" id="t1-p4" \${t.config?.['${_CK.p4}']?.enabled ? 'checked' : ''}> ${_PN.d4}</label>
                    <input type="number" id="t1-p4-port" placeholder="\u7aef\u53e3" value="\${t.config?.['${_CK.p4}']?.port || ''}" style="width:80px;padding:5px">
                  </div>
                  <div style="display:flex;align-items:center;gap:4px">
                    <label><input type="checkbox" id="t1-p5" \${t.config?.['${_CK.p5}']?.enabled ? 'checked' : ''}> ${_PN.d5}</label>
                    <input type="number" id="t1-p5-port" placeholder="\u7aef\u53e3" value="\${t.config?.['${_CK.p5}']?.port || ''}" style="width:80px;padding:5px">
                  </div>
                  <label><input type="checkbox" id="t1-usecf" \${t.config?.useCF ? 'checked' : ''}> \u8054\u52a8 CF \u96a7\u9053</label>
                </div>
                \${t.shareLinks?.length ? \`<div class="form-group"><label>\u5206\u4eab\u94fe\u63a5</label><textarea id="t1-links" rows="4" onclick="this.select()" readonly>\${t.shareLinks.map(l => l['${_KW.lk}']).join('\\n')}</textarea></div><div class="form-group"><label>\u8ba2\u9605\u94fe\u63a5 (Base64)</label><input id="t1-sub" value="\${t.collection || ''}" onclick="this.select()" readonly></div>\` : ''}
              \` : ''}
              \${name === '${_CK.t2}' ? \`
                <div class="form-group">
                  <label>\u7248\u672c</label>
                  <select id="t2-version" onchange="toggleT2Ver()">
                    <option value="v1" \${t.config?.version !== 'v0' ? 'selected' : ''}>v1 (\u65b0\u7248)</option>
                    <option value="v0" \${t.config?.version === 'v0' ? 'selected' : ''}>v0 (\u65e7\u7248)</option>
                  </select>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>\u670d\u52a1\u5668</label><input id="t2-server" value="\${t.config?.server || ''}" placeholder="v1: data.example.com / v0: data.example.com:443"></div>
                  <div class="form-group"><label>\u5bc6\u94a5</label><input type="password" id="t2-key" value="\${t.config?.key || ''}"></div>
                </div>
                <div id="t2-v0" style="display:\${t.config?.version === 'v0' ? 'block' : 'none'}">
                  <div class="form-group"><label><input type="checkbox" id="t2-tls" \${t.config?.tls !== false ? 'checked' : ''}> \u542f\u7528 TLS</label></div>
                </div>
                <div id="t2-v1" style="display:\${t.config?.version !== 'v0' ? 'block' : 'none'}">
                  <div class="form-group">
                    <label>UUID (\u7559\u7a7a\u81ea\u52a8\u751f\u6210)</label>
                    <div style="display:flex;gap:8px">
                      <input id="t2-uuid" value="\${t.config?.['${_KW.id}'] || ''}" onclick="this.select()">
                      <button class="btn btn-primary btn-sm" onclick="document.getElementById('t2-uuid').value = genUUID()">\u968f\u673a</button>
                    </div>
                  </div>
                  <div class="form-group" style="display:flex;flex-wrap:wrap;gap:15px">
                    <label><input type="checkbox" id="t2-insecure" \${t.config?.insecure ? 'checked' : ''}> \u8df3\u8fc7\u8bc1\u4e66\u9a8c\u8bc1</label>
                    <label><input type="checkbox" id="t2-gpu" \${t.config?.gpu ? 'checked' : ''}> \u4e0a\u62a5 GPU</label>
                    <label><input type="checkbox" id="t2-temp" \${t.config?.temperature ? 'checked' : ''}> \u4e0a\u62a5\u6e29\u5ea6</label>
                    <label><input type="checkbox" id="t2-ipv6" \${t.config?.useIPv6 ? 'checked' : ''}> \u4f7f\u7528 IPv6</label>
                    <label><input type="checkbox" id="t2-no-update" \${t.config?.disableAutoUpdate !== false ? 'checked' : ''}> \u7981\u7528\u81ea\u52a8\u66f4\u65b0</label>
                    <label><input type="checkbox" id="t2-no-cmd" \${t.config?.disableCommandExecute ? 'checked' : ''}> \u7981\u7528\u547d\u4ee4\u6267\u884c</label>
                  </div>
                </div>
              \` : ''}
              \${name === '${_CK.t3}' ? \`
                <div class="form-row">
                  <div class="form-group"><label>API \u7aef\u70b9</label><input id="t3-server" value="\${t.config?.server || ''}" placeholder="https://example.com"></div>
                  <div class="form-group"><label>Token</label><input type="password" id="t3-key" value="\${t.config?.key || ''}"></div>
                </div>
                <div class="form-group" style="display:flex;flex-wrap:wrap;gap:15px">
                  <label><input type="checkbox" id="t3-insecure" \${t.config?.insecure ? 'checked' : ''}> \u8df3\u8fc7\u8bc1\u4e66\u9a8c\u8bc1</label>
                  <label><input type="checkbox" id="t3-gpu" \${t.config?.gpu ? 'checked' : ''}> GPU \u76d1\u63a7</label>
                  <label><input type="checkbox" id="t3-no-update" \${t.config?.disableAutoUpdate !== false ? 'checked' : ''}> \u7981\u7528\u81ea\u52a8\u66f4\u65b0</label>
                </div>
              \` : ''}
              <div class="btn-group">
                \${!t.installed ? '<button class="btn btn-primary btn-sm" onclick="toolAction(\\'' + name + '\\',\\'install\\')">\u5b89\u88c5</button>' : ''}
                <button class="btn btn-primary btn-sm" onclick="saveConfig('\${name}')">\u4fdd\u5b58\u914d\u7f6e</button>
                \${t.installed && !t.running ? '<button class="btn btn-success btn-sm" onclick="toolAction(\\'' + name + '\\',\\'start\\')">\u542f\u52a8</button>' : ''}
                \${t.running ? '<button class="btn btn-warning btn-sm" onclick="toolAction(\\'' + name + '\\',\\'stop\\')">\u505c\u6b62</button>' : ''}
                \${t.running ? '<button class="btn btn-primary btn-sm" onclick="toolAction(\\'' + name + '\\',\\'restart\\')">\u91cd\u542f</button>' : ''}
                \${t.installed ? '<button class="btn btn-danger btn-sm" onclick="if(confirm(\\'\u786e\u5b9a\u5220\u9664\u4e8c\u8fdb\u5236\u6587\u4ef6\uff1f\\'))toolAction(\\'' + name + '\\',\\'deleteBin\\')">\u5220\u6587\u4ef6</button>' : ''}
                \${t.installed && !t.running ? '<button class="btn btn-danger btn-sm" onclick="deleteTool(\\'' + name + '\\')">\u5220\u9664</button>' : ''}
              </div>
            </div>
          \`).join('')}
          </div>
          <div id="tab-system" style="display:\${activeTab === 'system' ? 'block' : 'none'}">
            <div class="card">
              <div class="card-title">\u7ba1\u7406\u8d26\u53f7</div>
              <div class="form-row">
                <div class="form-group"><label>\u65b0\u7528\u6237\u540d</label><input id="new-user" placeholder="\u4e0d\u4fee\u6539\u8bf7\u7559\u7a7a"></div>
                <div class="form-group"><label>\u65b0\u5bc6\u7801</label><input type="password" id="new-pass" placeholder="\u4e0d\u4fee\u6539\u8bf7\u7559\u7a7a"></div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="updateAuth()">\u66f4\u65b0\u8d26\u53f7</button>
            </div>
            <div class="card" id="logsCard">
              <div class="card-title">\u8fd0\u884c\u65e5\u5fd7</div>
              <div id="logsSettings"></div>
              <div class="logs" id="logsContainer"></div>
            </div>
          </div>
        \`;
        document.getElementById('app').innerHTML = appHtml;
        const logsSettings = document.getElementById('logsSettings');
        if (logsSettings) {
          logsSettings.innerHTML = [
            '<div class="form-group" style="display:flex;flex-wrap:wrap;gap:15px;margin-top:10px">',
            '<label><input type="checkbox" id="log-enabled" onchange="saveLogsConfig()"> \u542f\u7528\u65e5\u5fd7</label>',
            '<label><input type="checkbox" id="log-tools" onchange="saveLogsConfig()"> \u5de5\u5177</label>',
            '<label><input type="checkbox" id="log-bots" onchange="saveLogsConfig()"> Bot</label>',
            '<label><input type="checkbox" id="log-api" onchange="saveLogsConfig()"> API</label>',
            '</div>',
            '<div class="form-group">',
            '<label>\u4fdd\u7559\u65e5\u5fd7\u6761\u6570</label>',
            '<input type="number" id="log-max" onchange="saveLogsConfig()">',
            '</div>'
          ].join('');
        }
        const logEnabled = document.getElementById('log-enabled');
        if (logEnabled) logEnabled.checked = !!logsConfig.enabled;
        const logTools = document.getElementById('log-tools');
        if (logTools) logTools.checked = !!logsConfig.logTools;
        const logBots = document.getElementById('log-bots');
        if (logBots) logBots.checked = !!logsConfig.logBots;
        const logApi = document.getElementById('log-api');
        if (logApi) logApi.checked = !!logsConfig.logApi;
        const logMax = document.getElementById('log-max');
        if (logMax) logMax.value = logsConfig.maxLines || 500;
        loadLogs();

      } catch (e) {
        toast(e.message, 'error');
      }
    };

    window.genUUID = () => {
      if (crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    window.toggleT0Mode = () => {
      const mode = document.getElementById('t0-mode').value;
      document.getElementById('t0-fixed').style.display = mode === 'fixed' ? 'block' : 'none';
      document.getElementById('t0-quick').style.display = mode === 'quick' ? 'block' : 'none';
    };

    window.toggleT2Ver = () => {
      const ver = document.getElementById('t2-version').value;
      document.getElementById('t2-v0').style.display = ver === 'v0' ? 'block' : 'none';
      document.getElementById('t2-v1').style.display = ver === 'v1' ? 'block' : 'none';
    };

    window.toggleAutoStart = async (name) => {
      try {
        const checked = document.getElementById(name + '-autostart').checked;
        await api('/tools/' + name + '/config', 'POST', { autoStart: checked });
        toast(checked ? '\u5df2\u542f\u7528\u81ea\u542f\u52a8' : '\u5df2\u7981\u7528\u81ea\u542f\u52a8');
      } catch (e) {
        toast(e.message, 'error');
        render();
      }
    };

    window.saveConfig = async (name) => {
      try {
        let cfg = {};
        if (name === '${_CK.t0}') {
          cfg = {
            mode: document.getElementById('t0-mode').value,
            token: document.getElementById('t0-token').value,
            domain: document.getElementById('t0-domain')?.value || '',
            protocol: document.getElementById('t0-protocol').value,
            localPort: parseInt(document.getElementById('t0-port').value) || 8001,
            localPort: parseInt(document.getElementById('t0-port').value) || 8001,
            autoDelete: document.getElementById(name + '-autodel')?.checked
          };
        } else if (name === '${_CK.t1}') {
          cfg = {
            autoDelete: document.getElementById(name + '-autodel')?.checked,
            port: parseInt(document.getElementById('t1-port').value) || 8001,
            ['${_KW.id}']: document.getElementById('t1-uuid')?.value || '',
            preferredDomain: document.getElementById('t1-domain')?.value || '',
            useCF: document.getElementById('t1-usecf')?.checked,
            protocols: {
              ['${_CK.p0}']: { enabled: document.getElementById('t1-p0')?.checked, wsPath: '${_DP._0}' },
              ['${_CK.p1}']: { enabled: document.getElementById('t1-p1')?.checked, wsPath: '${_DP._1}' },
              ['${_CK.p2}']: { enabled: document.getElementById('t1-p2')?.checked, wsPath: '${_DP._2}' },
              ['${_CK.p3}']: { enabled: document.getElementById('t1-p3')?.checked, wsPath: '${_DP._3}' }
            },
            ['${_CK.p4}']: { enabled: document.getElementById('t1-p4')?.checked, port: parseInt(document.getElementById('t1-p4-port').value) || 0 },
            ['${_CK.p5}']: { enabled: document.getElementById('t1-p5')?.checked, port: parseInt(document.getElementById('t1-p5-port').value) || 0 }
          };
        } else if (name === '${_CK.t2}') {
          cfg = {
            autoDelete: document.getElementById(name + '-autodel')?.checked,
            version: document.getElementById('t2-version').value,
            server: document.getElementById('t2-server').value,
            key: document.getElementById('t2-key').value,
            tls: document.getElementById('t2-tls')?.checked,
            ['${_KW.id}']: document.getElementById('t2-uuid')?.value || '',
            insecure: document.getElementById('t2-insecure')?.checked,
            gpu: document.getElementById('t2-gpu')?.checked,
            temperature: document.getElementById('t2-temp')?.checked,
            useIPv6: document.getElementById('t2-ipv6')?.checked,
            disableAutoUpdate: document.getElementById('t2-no-update')?.checked,
            disableCommandExecute: document.getElementById('t2-no-cmd')?.checked
          };
        } else if (name === '${_CK.t3}') {
          cfg = {
            autoDelete: document.getElementById(name + '-autodel')?.checked,
            server: document.getElementById('t3-server').value,
            key: document.getElementById('t3-key').value,
            insecure: document.getElementById('t3-insecure')?.checked,
            gpu: document.getElementById('t3-gpu')?.checked,
            disableAutoUpdate: document.getElementById('t3-no-update')?.checked
          };
        }
        await api('/tools/' + name + '/config', 'POST', cfg);
        toast('\u914d\u7f6e\u5df2\u4fdd\u5b58');
      } catch (e) {
        toast(e.message, 'error');
      }
    };

    window.saveLogsConfig = async () => {
      try {
        const cfg = {
          enabled: document.getElementById('log-enabled')?.checked,
          logTools: document.getElementById('log-tools')?.checked,
          logBots: document.getElementById('log-bots')?.checked,
          logApi: document.getElementById('log-api')?.checked,
          maxLines: parseInt(document.getElementById('log-max')?.value) || 500
        };
        await api('/logs/config', 'POST', cfg);
        toast('\u65e5\u5fd7\u8bbe\u7f6e\u5df2\u66f4\u65b0');
      } catch (e) {
        toast(e.message, 'error');
      }
    };

    window.updateAuth = async () => {
      try {
        const username = document.getElementById('new-user').value;
        const password = document.getElementById('new-pass').value;
        if (!username && !password) return toast('\u8bf7\u8f93\u5165\u8981\u4fee\u6539\u7684\u5185\u5bb9', 'error');
        await api('/auth/update', 'POST', { username, ['${_KW.pw}']: password });
        toast('\u8d26\u53f7\u5df2\u66f4\u65b0\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55');
        setTimeout(() => { token = ''; localStorage.removeItem('token'); checkAuth(); }, 1500);
      } catch (e) {
        toast(e.message, 'error');
      }
    };


    window.toolAction = async (name, action) => {
      try {
        toast(action === 'install' ? '\u6b63\u5728\u5b89\u88c5...' : (action === 'start' ? '\u6b63\u5728\u542f\u52a8...' : '\u6267\u884c\u4e2d...'));
        await api('/tools/' + name + '/' + action, 'POST');
        toast('\u64cd\u4f5c\u6210\u529f');
        render();
      } catch (e) {
        toast(e.message, 'error');
        render();
      }
    };

    window.deleteTool = async (name) => {
      if (!confirm('\u786e\u5b9a\u8981\u5220\u9664\u5417\uff1f')) return;
      try {
        await api('/tools/' + name + '/delete', 'POST');
        toast('\u5df2\u5220\u9664');
        render();
      } catch (e) {
        toast(e.message, 'error');
      }
    };

    const loadLogs = async () => {
      try {
        const res = await api('/logs');
        const container = document.getElementById('logsContainer');
        if (container) {
          container.innerHTML = res.logs.slice(-50).map(l => '<div class="log-entry">[' + l.time.substr(11, 8) + '] ' + l.msg + '</div>').join('');
          container.scrollTop = container.scrollHeight;
        }
      } catch {}
    };

    checkAuth();
    setInterval(loadLogs, 5000);
  </script>
</body>
</html>`;

const app = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  res.setHeader('Content-Type', 'application/json');

  const auth = () => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '');
    return verifyToken(token);
  };

  const sendJson = (data, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };

  const parseBody = () => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({}); }
      });
    });
  };

  if (path === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/' && method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.end(HTML);
    return;
  }

  if (path === '/api/login' && method === 'POST') {
    parseBody().then(body => {

      if (body.username === config.auth.username && body[_KW.pw] === config.auth[_KW.pw]) {
        sendJson({ success: true, token: createToken(body.username) });
      } else {

        sendJson({ error: '\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef' }, 401);
      }
    });
    return;
  }

  if (path === '/api/auth/check' && method === 'GET') {
    if (auth()) sendJson({ authenticated: true });
    else sendJson({ error: '\u672a\u6388\u6743' }, 401);
    return;
  }

  if (path === '/api/auth/update' && method === 'POST') {
    if (!auth()) return sendJson({ error: '\u672a\u6388\u6743' }, 401);
    parseBody().then(body => {

      if (body.username) config.auth.username = body.username;
      if (body[_KW.pw]) config.auth[_KW.pw] = body[_KW.pw];

      saveConfig();
      sendJson({ success: true });
    });
    return;
  }

  if (path === '/api/tools' && method === 'GET') {
    if (!auth()) return sendJson({ error: '\u672a\u6388\u6743' }, 401);
    const status = {};
    for (const [name, tool] of Object.entries(tools)) {
      status[name] = { ...tool.status(), config: config.tools[name] };
    }
    sendJson({ success: true, tools: status, arch: getArch(), logs: config.logs });
    return;
  }

  if (path === '/api/logs/config' && method === 'POST') {
    if (!auth()) return sendJson({ error: '\u672a\u6388\u6743' }, 401);
    parseBody().then(body => {
      config.logs = { ...config.logs, ...body };
      saveConfig();
      sendJson({ success: true, logs: config.logs });
    });
    return;
  }

  if (path === '/api/logs' && method === 'GET') {
    if (!auth()) return sendJson({ error: '\u672a\u6388\u6743' }, 401);
    sendJson({ success: true, logs });
    return;
  }

  const toolMatch = path.match(/^\/api\/tools\/([^/]+)\/([^/]+)$/);
  if (toolMatch && method === 'POST') {
    if (!auth()) return sendJson({ error: '\u672a\u6388\u6743' }, 401);
    const [, name, action] = toolMatch;
    const tool = tools[name];
    if (!tool) return sendJson({ error: '\u5de5\u5177\u4e0d\u5b58\u5728' }, 404);

    if (action === 'config') {
      parseBody().then(body => {
        config.tools[name] = { ...config.tools[name], ...body };
        saveConfig();
        sendJson({ success: true });
      });
      return;
    }

    if (['install', 'start', 'stop', 'restart', 'delete', 'deleteBin'].includes(action)) {
      (async () => {
        try {
          await tool[action]();
          sendJson({ success: true, status: tool.status() });
        } catch (err) {
          sendJson({ error: err.message }, 400);
        }
      })();
      return;
    }

    sendJson({ error: '\u65e0\u6548\u64cd\u4f5c' }, 400);
    return;
  }

  sendJson({ error: 'Not Found' }, 404);
};

const server = createServer(app);

const cleanupOrphans = () => {
  log('tool', 'info', '\u6b63\u5728\u6e05\u7406\u6b8b\u7559\u8fdb\u7a0b...');
  for (const [key, filename] of Object.entries(fileMap)) {
    if (key.includes('bin') && filename) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /F /IM ${filename}.exe`, { stdio: 'ignore' });
        } else {
          execSync(`pkill -f ${filename}`, { stdio: 'ignore' });
        }
      } catch { }
    }
  }
};
cleanupOrphans();

const PORT = parseInt(process.env.SERVER_PORT || process.env.PRIMARY_PORT || process.env.PORT, 10) || config.port || 3097;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Tools Standalone start');
  log('tool', 'info', `\u670d\u52a1\u542f\u52a8\u4e8e\u7aef\u53e3 ${PORT}`);

  for (const [name, cfg] of Object.entries(config.tools)) {
    if (cfg.autoStart && tools[name]) {
      if (cfg.autoStart && tools[name]) {
        // Retry up to 3 times with 2s delay
        const startWithRetry = async (retries = 3) => {
          try {
            await tools[name].start();
          } catch (err) {
            if (retries > 0) {
              log('tool', 'error', `[${name}] \u81ea\u52a8\u542f\u52a8\u5931\u8d25: ${err.message}\uff0c2\u79d2\u540e\u91cd\u8bd5 (${retries})`);
              setTimeout(() => startWithRetry(retries - 1), 2000);
            } else {
              log('tool', 'error', `[${name}] \u81ea\u52a8\u542f\u52a8\u6700\u7ec8\u5931\u8d25: ${err.message}`);
            }
          }
        };
        startWithRetry();
      }
    }
  }
});
