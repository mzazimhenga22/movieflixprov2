/**
 * ensure-js-extensions.js
 * Scans providers/lib for .js files and makes sure relative imports pointing
 * to local files include a proper extension (.js or /index.js).
 *
 * Safe: only modifies imports/exports that are missing an extension and where
 * we can detect the actual target file on disk (either spec + '.js' or spec + '/index.js').
 *
 * Run: node providers/scripts/ensure-js-extensions.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'providers', 'lib');

if (!fs.existsSync(root)) {
  console.error('providers/lib not found; are you running this from the repo root?');
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

let totalChanges = 0;
const changedFiles = [];

const IMPORT_EXPORT_RE = /(import\s.*?from\s+|export\s+.*?\sfrom\s+)(['"])(\.{1,2}\/[^'"]+?)(['"])/g;

for (const file of jsFiles) {
  let text = fs.readFileSync(file, 'utf8');
  let replaced = false;

  text = text.replace(IMPORT_EXPORT_RE, (full, pre, q1, spec, q2) => {
    // Only target relative imports (./ or ../). Ignore bare specifiers.
    if (!spec.startsWith('./') && !spec.startsWith('../')) return full;

    // If it already ends with a known extension, skip.
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
      // No matching file found; leave unchanged so we don't break things.
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
if (changedFiles.length) {
  console.log('Changed files:');
  changedFiles.forEach(f => console.log('  -', f));
}
