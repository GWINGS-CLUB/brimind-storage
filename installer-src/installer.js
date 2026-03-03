// installer-src/installer.js
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const BASE_URL = 'https://brimind.pro/storage';
const INSTALL_DIR = path.join(os.homedir(), 'VibeBrimind');
const FLAG_FILE = path.join(INSTALL_DIR, '.installed');

function detectOS() {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'win32') return { os: 'windows', zip: 'Vibe-Brimind-windows.zip', exe: 'Vibe-Brimind.exe', dir: path.join(INSTALL_DIR, 'windows') };
  if (platform === 'darwin') {
    if (arch === 'arm64') return { os: 'mac', zip: 'Vibe-Brimind-mac.zip', exe: 'Vibe-Brimind', dir: path.join(INSTALL_DIR, 'mac') };
    return { os: 'mac-intel', zip: 'Vibe-Brimind-mac-x64.zip', exe: 'Vibe-Brimind', dir: path.join(INSTALL_DIR, 'mac') };
  }
  if (platform === 'linux') return { os: 'linux', zip: 'Vibe-Brimind-linux.zip', exe: 'Vibe-Brimind', dir: path.join(INSTALL_DIR, 'linux') };
  throw new Error('Unsupported OS: ' + platform);
}

function log(msg) {
  process.stdout.write(msg + '\n');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    log(' Connecting to server...');
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    let downloaded = 0;
    let total = 0;
    let lastPct = 0;

    const request = proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error('Download failed: ' + res.statusCode));
      }
      total = parseInt(res.headers['content-length'] || '0', 10);
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0) {
          const pct = Math.floor((downloaded / total) * 100);
          if (pct !== lastPct && pct % 5 === 0) {
            const mb = (downloaded / 1024 / 1024).toFixed(1);
            const totalMb = (total / 1024 / 1024).toFixed(1);
            process.stdout.write(`\r  Progress: ${pct}% (${mb} / ${totalMb} MB)  `);
            lastPct = pct;
          }
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve(dest); });
    });
    request.on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch(_){} reject(e); });
    file.on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch(_){} reject(e); });
  });
}

function extractZip(zipPath, destDir) {
  log(' Extracting...');
  fs.mkdirSync(destDir, { recursive: true });
  if (process.platform === 'win32') {
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`, { stdio: 'inherit' });
  } else {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
  }
}

function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    try { execSync(`chmod +x "${filePath}"`, { stdio: 'pipe' }); } catch(_) {}
  }
}

function findExe(dir, exeName) {
  if (fs.existsSync(path.join(dir, exeName))) return path.join(dir, exeName);
  // search subdirs one level
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const sub = path.join(dir, e);
    if (fs.statSync(sub).isDirectory()) {
      const candidate = path.join(sub, exeName);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function launchApp(exePath) {
  log('\n [3/3] Launching Vibe Brimind...');
  makeExecutable(exePath);
  const child = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });
  child.unref();
  log(' Done! Vibe Brimind is running.');
  log(' You can close this window.');
}

async function main() {
  log('');
  log(' ============================================');
  log('  Vibe Brimind - Installer / Launcher');
  log(' ============================================');
  log('');

  let info;
  try {
    info = detectOS();
  } catch(e) {
    log(' ERROR: ' + e.message);
    waitExit(1);
    return;
  }

  log(` Detected: ${info.os} (${process.arch})`);
  log('');

  const exePath = findExe(info.dir, info.exe);

  // Already installed — just launch
  if (fs.existsSync(FLAG_FILE) && exePath) {
    log(' Already installed. Launching...');
    launchApp(exePath);
    waitExit(0);
    return;
  }

  log(' First time setup — this may take a minute...');
  log('');

  // Download
  const zipUrl = `${BASE_URL}/${info.zip}`;
  const zipDest = path.join(os.tmpdir(), info.zip);
  log(` [1/3] Downloading ${info.zip}...`);
  try {
    await downloadFile(zipUrl, zipDest);
    log(' Download complete.');
  } catch(e) {
    log(' ERROR: Download failed — ' + e.message);
    log(' Check your internet connection and try again.');
    waitExit(1);
    return;
  }

  // Extract
  log('');
  log(' [2/3] Extracting...');
  try {
    extractZip(zipDest, info.dir);
    fs.unlinkSync(zipDest);
    log(' Extraction complete.');
  } catch(e) {
    log(' ERROR: Extraction failed — ' + e.message);
    waitExit(1);
    return;
  }

  // Find exe and launch
  const foundExe = findExe(info.dir, info.exe);
  if (!foundExe) {
    log(' ERROR: Executable not found after extraction.');
    waitExit(1);
    return;
  }

  // Save flag
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  fs.writeFileSync(FLAG_FILE, new Date().toISOString());

  launchApp(foundExe);
  waitExit(0);
}

function waitExit(code) {
  if (process.platform === 'win32') {
    log('');
    log(' Press any key to close...');
    try {
      execSync('pause', { stdio: 'inherit', shell: true });
    } catch(_) {}
  } else {
    setTimeout(() => process.exit(code), 3000);
  }
}

main().catch((e) => {
  log('\n FATAL ERROR: ' + e.message);
  waitExit(1);
});
