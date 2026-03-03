// installer-src/build-installer.js
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const targets = [
  { target: 'node18-win-x64',      out: 'VibeBrimind-Installer-windows.exe' },
  { target: 'node18-macos-arm64',  out: 'VibeBrimind-Installer-mac.command' },
  { target: 'node18-macos-x64',    out: 'VibeBrimind-Installer-mac-intel.command' },
  { target: 'node18-linux-x64',    out: 'VibeBrimind-Installer-linux.sh' }
];

fs.mkdirSync(DIST, { recursive: true });

function pkgBuild(target, outFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n  Building ${outFile}...`);
    const outPath = path.join(DIST, outFile);
    const proc = spawn(
      'npx', ['pkg', 'installer.js',
        '--targets', target,
        '--output', outPath,
        '--public'
      ],
      { cwd: ROOT, stdio: 'inherit', shell: true }
    );
    const hb = setInterval(() => process.stdout.write(`  still building...\n`), 15000);
    proc.on('close', (code) => {
      clearInterval(hb);
      if (code === 0) {
        // make executable on unix
        if (!outFile.endsWith('.exe')) {
          try { execSync(`chmod +x "${outPath}"`, { stdio: 'pipe' }); } catch(_) {}
        }
        console.log(`  Done: dist/${outFile}`);
        resolve();
      } else {
        reject(new Error(`pkg failed for ${target} with code ${code}`));
      }
    });
    proc.on('error', (e) => { clearInterval(hb); reject(e); });
  });
}

(async () => {
  console.log('\n Installing pkg...');
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });

  console.log('\n Building installer binaries...\n');
  for (const t of targets) {
    try {
      await pkgBuild(t.target, t.out);
    } catch(e) {
      console.error(`  FAILED: ${t.out} — ${e.message}`);
    }
  }

  console.log('\n Build complete! Files in installer-src/dist/');
  const files = fs.readdirSync(DIST);
  for (const f of files) {
    const size = (fs.statSync(path.join(DIST, f)).size / 1024 / 1024).toFixed(1);
    console.log(`   ${f} (${size} MB)`);
  }

  console.log('\n Next steps:');
  console.log('  1. Go to https://github.com/GWINGS-CLUB/brimind-storage/releases/new');
  console.log('  2. Tag: v1.0.0 (or bump version)');
  console.log('  3. Upload all files from installer-src/dist/');
  console.log('  4. Publish release');
  console.log('  5. URLs will be: https://github.com/GWINGS-CLUB/brimind-storage/releases/latest/download/<filename>');
})();
