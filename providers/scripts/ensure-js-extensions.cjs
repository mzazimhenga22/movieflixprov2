// providers/scripts/ensure-js-extensions.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'providers', 'lib');
if (!fs.existsSync(root)) {
  console.error('providers/lib not found; run from repo root after building providers');
  process.exit(1);
}

const jsFiles = [];
function walk(dir) {
  for (const nm of fs.readdirSync(dir)) {
    const full = path.join(dir, nm);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (st.isFile() && nm.endsWith('.js')) jsFiles.push(full);
  }
}
walk(root);

const IMPORT_EXPORT_RE = /(import\s.*?from\s+|export\s+.*?\sfrom\s+)(['"])(\.{1,2}\/[^'"]+?)(['"])/g;
let totalChanges = 0;
const changedFiles = [];

for (const file of jsFiles) {
  let text = fs.readFileSync(file, 'utf8');
  let replaced = false;

  text = text.replace(IMPORT_EXPORT_RE, (full, pre, q1, spec, q2) => {
    if (!spec.startsWith('./') && !spec.startsWith('../')) return full;
    if (/\.(js|mjs|cjs|ts)$/.test(spec)) return full;

    const fileDir = path.dirname(file);
    const candidateJs = path.resolve(fileDir, spec + '.js');
    const candidateIndex = path.resolve(fileDir, spec, 'index.js');

    if (fs.existsSync(candidateJs)) {
      replaced = true;
      totalChanges++;
      return `${pre}${q1}${spec}.js${q2}`;
    } else if (fs.existsSync(candidateIndex)) {
      replaced = true;
      totalChanges++;
      return `${pre}${q1}${spec}/index.js${q2}`;
    } else {
      return full;
    }
  });

  if (replaced) {
    fs.writeFileSync(file, text, 'utf8');
    changedFiles.push(path.relative(process.cwd(), file));
  }
}

console.log(`Scanned ${jsFiles.length} .js files under providers/lib`);
console.log(`Modified ${changedFiles.length} files (${totalChanges} replacements)`);
if (changedFiles.length) changedFiles.forEach(f => console.log('  -', f));
