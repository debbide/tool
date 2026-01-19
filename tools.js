import { spawn, execSync } from 'child_process';
import { createWriteStream, createReadStream, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';
import { randomUUID } from 'crypto';
import { createGunzip, inflateRaw } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const BIN_DIR = join(DATA_DIR, 'bin');
const CONFIG_FILE = join(DATA_DIR, 'config.json');
const FILE_MAP_FILE = join(DATA_DIR, 'filemap.dat');
const CERT_FILE = join(DATA_DIR, 'cert.pem');
const KEY_FILE = join(DATA_DIR, 'key.pem');

const generateRandomName = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const XOR_KEY = 'minebot-toolbox-xor-key-2024';
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

let fileMap = {};
const loadFileMap = () => {
  try {
    if (existsSync(FILE_MAP_FILE)) {
      const encoded = readFileSync(FILE_MAP_FILE, 'utf-8');
      fileMap = JSON.parse(xorDecrypt(encoded));
    }
  } catch { fileMap = {}; }
};

const saveFileMap = () => {
  const encoded = xorEncrypt(JSON.stringify(fileMap));
  writeFileSync(FILE_MAP_FILE, encoded);
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

const writeEncryptedConfig = (filePath, content) => {
  const encrypted = xorEncrypt(typeof content === 'string' ? content : JSON.stringify(content));
  writeFileSync(filePath, encrypted);
};

const readEncryptedConfig = (filePath) => {
  try {
    const encrypted = readFileSync(filePath, 'utf-8');
    return xorDecrypt(encrypted);
  } catch { return null; }
};

const ensureCert = () => {
  if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) return;
  log('tool', 'info', '\u6b63\u5728\u751f\u6210\u81ea\u7b7e\u540d\u8bc1\u4e66...');
  try {
    const cmd = `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -sha256 -days 3650 -nodes -subj "/CN=minebot-toolbox"`;
    try {
      execSync(cmd);
    } catch {
      execSync(`wsl ${cmd}`);
    }
    log('tool', 'success', '\u81ea\u7b7e\u540d\u8bc1\u4e66\u751f\u6210\u6210\u529f');
  } catch (err) {
    log('tool', 'error', `\u751f\u6210\u8bc1\u4e66\u5931\u8d25: ${err.message}`);
  }
};

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

const _DL = {
  cf: _d('aHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2Nsb3VkZmxhcmVkLWxpbnV4LQ=='),
  xr: _d('aHR0cHM6Ly9naXRodWIuY29tL1hUTFMvWHJheS1jb3JlL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9YcmF5LWxpbnV4LQ=='),
  hy: _d('aHR0cHM6Ly9naXRodWIuY29tL2FwZXJuZXQvaHlzdGVyaWEvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2h5c3RlcmlhLWxpbnV4LQ=='),
  tu: _d('aHR0cHM6Ly9naXRodWIuY29tL0VBaW1UWS90dWljL3JlbGVhc2VzL2Rvd25sb2FkL3R1aWMtc2VydmVyLQ=='),
  nz0: _d('aHR0cHM6Ly9naXRodWIuY29tL25haWJhL25lemhhL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9uZXpoYS1hZ2VudF9saW51eF8='),
  nz1: _d('aHR0cHM6Ly9naXRodWIuY29tL25lemhhaHEvYWdlbnQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL25lemhhLWFnZW50X2xpbnV4Xw=='),
  km: _d('aHR0cHM6Ly9naXRodWIuY29tL2tvbWFyaS1tb25pdG9yL2tvbWFyaS1hZ2VudC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQva29tYXJpLWFnZW50LWxpbnV4LQ==')
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
  _8: _d('c3M=')
};

const _DP = { _0: '/p0', _1: '/p1', _2: '/p2', _3: '/p3' };
const _LID = { S0: _CK.t0, S1: _CK.t1, S2: _CK.t2, S3: _CK.t3, S4: _CK.p4, S5: _CK.p5 };

const _KW = {
  pw: _d('cGFzc3dvcmQ='),
  px: _d('cHJveHk='),
  lk: _d('bGluaw=='),
  ul: _d('dXJs'),
  id: _d('dXVpZA==')
};

const log = (type, level, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] [${level}] ${message}`);
};

let config = {
  tools: {
    [_CK.t0]: { enabled: false, autoStart: false, mode: 'fixed', token: '', protocol: 'http', localPort: 8001 },
    [_CK.t1]: {
      enabled: true,
      autoStart: true,
      mode: 'auto',
      port: 8001,
      [_KW.id]: '',
      [_KW.pw]: '',
      ssMethod: 'aes-256-gcm',
      useCF: false,
      preferredDomain: '',
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
    [_CK.t2]: {
      enabled: false,
      autoStart: false,
      version: 'v1',
      server: '',
      key: '',
      tls: true,
      insecure: false,
      gpu: false,
      temperature: false,
      useIPv6: false,
      disableAutoUpdate: true,
      disableCommandExecute: false
    },
    [_CK.t3]: {
      enabled: false,
      autoStart: false,
      server: '',
      key: '',
      insecure: false,
      gpu: false,
      disableAutoUpdate: true
    }
  }
};

const loadConfig = () => {
  try {
    if (existsSync(CONFIG_FILE)) {
      config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
};

const saveConfig = () => {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

const toolProcesses = new Map();

const getArch = () => {
  const arch = process.arch;
  const platform = process.platform;
  const isLinux = platform === 'linux';
  let archName = 'amd64';
  if (arch === 'arm64' || arch === 'aarch64') archName = 'arm64';
  else if (arch === 'arm') archName = 'arm';
  return { archName, isLinux, platform };
};

const startToolProcess = (name, binPath, args, env = {}, onLog = null) => {
  if (toolProcesses.has(name)) {
    log('tool', 'warn', `[${name}] \u5df2\u5728\u8fd0\u884c`);
    return;
  }

  const child = spawn(binPath, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    if (onLog) onLog(text);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    if (onLog) onLog(text);
  });

  child.on('error', (err) => {
    log('tool', 'error', `[${name}] \u8fdb\u7a0b\u9519\u8bef: ${err.message}`);
    toolProcesses.delete(name);
  });

  child.on('exit', (code, signal) => {
    log('tool', 'warn', `[${name}] \u8fdb\u7a0b\u9000\u51fa (Code: ${code}, Signal: ${signal})`);
    toolProcesses.delete(name);
  });
  toolProcesses.set(name, child);
};

const stopToolProcess = (name) => {
  const proc = toolProcesses.get(name);
  if (proc) {
    proc.kill('SIGTERM');
    toolProcesses.delete(name);
    log('tool', 'info', `[${name}] \u5df2\u505c\u6b62`);
  }
};

const download = (url, dest) => new Promise((resolve, reject) => {
  log('tool', 'info', `\u4e0b\u8f7d: ${url}`);

  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  const doRequest = (url, redirectCount = 0) => {
    if (redirectCount > 10) {
      reject(new Error('\u91cd\u5b9a\u5411\u6b21\u6570\u8fc7\u591a'));
      return;
    }

    const getter = url.startsWith('https') ? httpsGet : httpGet;
    getter(url, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        if (location) {
          const nextUrl = location.startsWith('http') ? location : new URL(location, url).href;
          doRequest(nextUrl, redirectCount + 1);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`\u4e0b\u8f7d\u5931\u8d25: HTTP ${res.statusCode}`));
        return;
      }

      const file = createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', err => { rmSync(dest, { force: true }); reject(err); });
    }).on('error', err => { rmSync(dest, { force: true }); reject(err); });
  };

  doRequest(url);
});

const gunzipFile = (src, dest) => new Promise((resolve, reject) => {
  const gunzip = createGunzip();
  const source = createReadStream(src);
  const destination = createWriteStream(dest);

  source.pipe(gunzip).pipe(destination);
  destination.on('finish', () => {
    rmSync(src, { force: true });
    resolve();
  });
  destination.on('error', reject);
  source.on('error', reject);
  gunzip.on('error', reject);
});

const unzipFile = (zipPath, targetFileName, destPath) => new Promise((resolve, reject) => {
  try {
    const data = readFileSync(zipPath);
    let offset = 0;

    while (offset < data.length - 4) {
      if (data.readUInt32LE(offset) !== 0x04034b50) {
        offset++;
        continue;
      }

      const compressionMethod = data.readUInt16LE(offset + 8);
      const compressedSize = data.readUInt32LE(offset + 18);
      const fileNameLength = data.readUInt16LE(offset + 26);
      const extraFieldLength = data.readUInt16LE(offset + 28);
      const fileName = data.slice(offset + 30, offset + 30 + fileNameLength).toString();

      const dataStart = offset + 30 + fileNameLength + extraFieldLength;
      const fileData = data.slice(dataStart, dataStart + compressedSize);

      if (fileName === targetFileName || fileName.endsWith('/' + targetFileName)) {
        if (compressionMethod === 0) {
          writeFileSync(destPath, fileData);
          rmSync(zipPath, { force: true });
          resolve();
          return;
        } else if (compressionMethod === 8) {
          inflateRaw(fileData, (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            writeFileSync(destPath, result);
            rmSync(zipPath, { force: true });
            resolve();
          });
          return;
        }
      }

      offset = dataStart + compressedSize;
    }

    reject(new Error(`\u5728 ZIP \u4e2d\u627e\u4e0d\u5230\u6587\u4ef6: ${targetFileName}`));
  } catch (err) {
    reject(err);
  }
});

const tools = {
  [_CK.t0]: {
    bin: () => join(BIN_DIR, getRandomFileName(_CK.t0, 'bin')),
    cfg: () => join(DATA_DIR, getRandomFileName(_CK.t0, 'cfg')),
    async install() {
      const { archName, isLinux } = getArch();
      if (!isLinux) throw new Error('\u4ec5\u652f\u6301 Linux');
      await download(_DL.cf + archName, this.bin());
      chmodSync(this.bin(), '755');
    },
    async start() {
      const { mode, token, protocol, localPort } = config.tools[_CK.t0];
      log('tool', 'info', `[${_LID.S0}] Cloudflare Tunnel Target Port: ${localPort}`);

      if (!existsSync(this.bin())) {
        log('tool', 'info', `[${_LID.S0}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await this.install();
      }

      const onLog = (text) => {
        const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
          const url = match[0];
          const domain = url.replace('https://', '');
          if (config.tools[_CK.t0].tunnelUrl !== domain) {
            config.tools[_CK.t0].tunnelUrl = domain;
            saveConfig();
            log('tool', 'success', `[${_LID.S0}] \u6355\u83b7\u5230\u96a7\u9053\u57df\u540d: ${domain}`);
          }
        }
      };

      if (mode === 'fixed') {
        if (!token) throw new Error('\u8bf7\u914d\u7f6e Token');
        writeEncryptedConfig(this.cfg(), token);
        const decryptedToken = readEncryptedConfig(this.cfg());
        startToolProcess(_LID.S0, this.bin(), ['tunnel', '--no-autoupdate', 'run'], { TUNNEL_TOKEN: decryptedToken }, onLog);
      } else {
        if (!localPort) throw new Error('\u8bf7\u914d\u7f6e\u672c\u5730\u7aef\u53e3');
        const url = `${protocol || 'http'}://localhost:${localPort}`;
        startToolProcess(_LID.S0, this.bin(), ['tunnel', '--no-autoupdate', '--url', url], {}, onLog);
      }
    },
    stop() {
      stopToolProcess(_LID.S0);
      const binPath = this.bin();
      const cfgPath = this.cfg();
      setTimeout(() => {
        rmSync(binPath, { force: true });
        rmSync(cfgPath, { force: true });
        log('tool', 'info', `[${_LID.S0}] \u5df2\u6e05\u7406\u4e8c\u8fdb\u5236\u6587\u4ef6\u548c\u4e34\u65f6\u914d\u7f6e`);
      }, 1000);
    },
    uninstall() {
      this.stop();
      rmSync(this.bin(), { force: true });
    },
    delete() {
      this.stop();
      clearRandomFileName(_CK.t0, 'bin');
      clearRandomFileName(_CK.t0, 'cfg');
      config.tools[_CK.t0] = { enabled: false, mode: 'fixed', token: '', protocol: 'http', localPort: 3000 };
      saveConfig();
    },
    async restart() {
      this.stop();
      await new Promise(r => setTimeout(r, 500));
      this.start();
    },
    status() { return { installed: existsSync(this.bin()), running: toolProcesses.has(_LID.S0) }; }
  },

  [_CK.t2]: {
    bin: () => join(BIN_DIR, getRandomFileName(_CK.t2 + '-agent', 'bin')),
    async install() {
      const { archName, isLinux } = getArch();
      if (!isLinux) throw new Error('\u4ec5\u652f\u6301 Linux');
      const version = config.tools[_CK.t2].version || 'v1';

      if (version === 'v0') {
        const gz = join(BIN_DIR, getRandomFileName(_CK.t2 + '-install', 'gz') + '.gz');
        try {
          await download(_DL.nz0 + `${archName}.gz`, gz);
          await gunzipFile(gz, this.bin());
        } finally {
          if (existsSync(gz)) rmSync(gz, { force: true });
        }
      } else {
        const zip = join(BIN_DIR, getRandomFileName(_CK.t2 + '-install', 'zip') + '.zip');
        try {
          await download(_DL.nz1 + `${archName}.zip`, zip);
          await unzipFile(zip, _CK.t2 + '-agent', this.bin());
        } finally {
          if (existsSync(zip)) rmSync(zip, { force: true });
        }
      }
      chmodSync(this.bin(), '755');
    },
    cfg: () => join(DATA_DIR, getRandomFileName(_CK.t2, 'cfg') + '.yml'),
    async start() {
      const cfg = config.tools[_CK.t2];
      if (!cfg.server || !cfg.key) throw new Error('\u8bf7\u914d\u7f6e\u670d\u52a1\u5668\u548c\u5bc6\u94a5');

      if (!existsSync(this.bin())) {
        log('tool', 'info', `[${_LID.S2}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await this.install();
      }

      if (cfg.version === 'v0') {
        const args = ['-s', cfg.server, '-p', cfg.key];
        if (cfg.tls) args.push('--tls');
        startToolProcess(_LID.S2, this.bin(), args);
      } else {
        if (!cfg.uuid) {
          cfg.uuid = randomUUID();
          config.tools[_CK.t2].uuid = cfg.uuid;
          saveConfig();
        }

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

        const s2Cfg = {
          client_secret: cfg.key,
          debug: true,
          disable_auto_update: cfg.disableAutoUpdate !== false,
          disable_command_execute: cfg.disableCommandExecute || false,
          disable_force_update: true,
          disable_nat: false,
          disable_send_query: false,
          gpu: cfg.gpu || false,
          insecure_tls: cfg.insecure || false,
          ip_report_period: 1800,
          report_delay: 1,
          self_update_period: 0,
          server: serverAddr,
          skip_connection_count: false,
          skip_procs_count: false,
          temperature: cfg.temperature || false,
          tls: useTls,
          use_gitee_to_upgrade: false,
          use_ipv6_country_code: cfg.useIPv6 || false,
          uuid: cfg.uuid
        };

        const yamlContent = Object.entries(s2Cfg)
          .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join('\n');
        writeEncryptedConfig(this.cfg(), yamlContent);

        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t2 + '-plain', 'cfg') + '.yml');
        writeFileSync(plainCfg, readEncryptedConfig(this.cfg()));

        startToolProcess(_LID.S2, this.bin(), ['-c', plainCfg]);
        setTimeout(() => rmSync(plainCfg, { force: true }), 2000);
      }
    },
    stop() {
      stopToolProcess(_LID.S2);
      const binPath = this.bin();
      const cfgPath = this.cfg();
      setTimeout(() => {
        rmSync(binPath, { force: true });
        rmSync(cfgPath, { force: true });
        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t2 + '-plain', 'cfg') + '.yml');
        rmSync(plainCfg, { force: true });
        log('tool', 'info', `[${_LID.S2}] \u5df2\u6e05\u7406\u4e8c\u8fdb\u5236\u6587\u4ef6\u548c\u4e34\u65f6\u914d\u7f6e`);
      }, 1000);
    },
    uninstall() {
      this.stop();
      rmSync(this.bin(), { force: true });
      rmSync(this.cfg(), { force: true });
    },
    delete() {
      this.stop();
      clearRandomFileName(_CK.t2 + '-agent', 'bin');
      clearRandomFileName(_CK.t2, 'cfg');
      clearRandomFileName(_CK.t2 + '-plain', 'cfg');
      config.tools[_CK.t2] = {
        enabled: false, version: 'v1', server: '', key: '', tls: true,
        insecure: false, gpu: false, temperature: false, useIPv6: false,
        disableAutoUpdate: true, disableCommandExecute: false, uuid: ''
      };
      saveConfig();
    },
    async restart() {
      this.stop();
      await new Promise(r => setTimeout(r, 500));
      this.start();
    },
    status() { return { installed: existsSync(this.bin()), running: toolProcesses.has(_LID.S2) }; }
  },

  [_CK.t3]: {
    bin: () => join(BIN_DIR, getRandomFileName(_CK.t3 + '-agent', 'bin')),
    cfg: () => join(DATA_DIR, getRandomFileName(_CK.t3, 'cfg') + '.yml'),
    async install() {
      const { archName, isLinux } = getArch();
      if (!isLinux) throw new Error('\u4ec5\u652f\u6301 Linux');
      await download(_DL.km + archName, this.bin());
      chmodSync(this.bin(), '755');
    },
    async start() {
      const cfg = config.tools[_CK.t3];
      if (!cfg.server || !cfg.key) throw new Error('\u8bf7\u914d\u7f6e\u670d\u52a1\u5668\u548c\u5bc6\u94a5');

      if (!existsSync(this.bin())) {
        log('tool', 'info', `[${_LID.S3}] \u4e8c\u8fdb\u5236\u6587\u4ef6\u7f3a\u5931\uff0c\u6b63\u5728\u4e0b\u8f7d...`);
        await this.install();
      }

      const s3Cfg = {
        endpoint: cfg.server,
        token: cfg.key,
        ignore_unsafe_cert: cfg.insecure || false,
        gpu: cfg.gpu || false,
        disable_auto_update: cfg.disableAutoUpdate !== false
      };

      writeEncryptedConfig(this.cfg(), JSON.stringify(s3Cfg, null, 2));

      const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t3 + '-plain', 'cfg') + '.json');
      writeFileSync(plainCfg, readEncryptedConfig(this.cfg()));

      startToolProcess(_LID.S3, this.bin(), ['--config', plainCfg]);
      setTimeout(() => rmSync(plainCfg, { force: true }), 2000);
    },
    stop() {
      stopToolProcess(_LID.S3);
      const binPath = this.bin();
      const cfgPath = this.cfg();
      setTimeout(() => {
        rmSync(binPath, { force: true });
        rmSync(cfgPath, { force: true });
        const plainCfg = join(DATA_DIR, getRandomFileName(_CK.t3 + '-plain', 'cfg') + '.json');
        rmSync(plainCfg, { force: true });
        log('tool', 'info', `[${_LID.S3}] \u5df2\u6e05\u7406\u4e8c\u8fdb\u5236\u6587\u4ef6\u548c\u4e34\u65f6\u914d\u7f6e`);
      }, 1000);
    },
    uninstall() {
      this.stop();
    },
    delete() {
      this.stop();
      clearRandomFileName(_CK.t3 + '-agent', 'bin');
      clearRandomFileName(_CK.t3, 'cfg');
      clearRandomFileName(_CK.t3 + '-plain', 'cfg');
      config.tools[_CK.t3] = {
        enabled: false, server: '', key: '',
        insecure: false, gpu: false, disableAutoUpdate: true
      };
      saveConfig();
    },
    async restart() {
      this.stop();
      await new Promise(r => setTimeout(r, 500));
      await this.start();
    },
    status() { return { installed: existsSync(this.bin()), running: toolProcesses.has(_LID.S3) }; }
  }
};

loadFileMap();
loadConfig();

[DATA_DIR, BIN_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

export {
  tools,
  config,
  saveConfig,
  loadConfig,
  _CK,
  _DL,
  _PN,
  _DP,
  _LID,
  _KW,
  log,
  toolProcesses
};
