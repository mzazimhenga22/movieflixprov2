#!/usr/bin/env node
// providers/scripts/ensure-js-extensions.cjs
// Robust: finds providers/lib when run from repo root or from providers/ (or nested pnpm).
// Adds .js or /index.js to relative import/export specifiers when the referenced file exists.

const fs = require('fs');
const path = require('path');

function findLibRoot() {
  const candidates = [
    path.resolve(process.cwd(), 'providers', 'lib'), // repo root run
    path.resolve(process.cwd(), 'lib'),              // run from providers/
    path.resolve(__dirname, '..', 'lib'),            // run from providers/scripts
    path.resolve(__dirname, '..', '..', 'lib')      // pnpm nested contexts
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
    } catch (err) { /* ignore */ }
  }
  // fallback: climb up and look for providers/lib
  let p = process.cwd();
  for (let i = 0; i < 8; i++) {
    const maybe = path.resolve(p, 'providers', 'lib');
    try {
      if (fs.existsSync(maybe) && fs.statSync(maybe).isDirectory()) return maybe;
    } catch (err) { /* ignore */ }
    p = path.resolve(p, '..');
  }
  return null;
}

const root = findLibRoot();
if (!root) {
  console.error('providers/lib not found; run from repo root after building providers (checked multiple locations).');
  process.exit(1);
}

function walk(dir, cb) {
  for (const nm of fs.readdirSync(dir)) {
    const full = path.join(dir, nm);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, cb);
    else if (st.isFile() && nm.endsWith('.js')) cb(full);
  }
}

// match import ... from '...'; and export ... from '...'
const IMPORT_EXPORT_RE = /(import\s.*?from\s+|export\s+.*?\sfrom\s+)(['"])(\.{1,2}\/[^'"]+?)(['"])/g;

let changedFiles = [];
let totalReplacements = 0;

walk(root, (file) => {
  let text = fs.readFileSync(file, 'utf8');
  let replaced = false;

  text = text.replace(IMPORT_EXPORT_RE, (full, pre, q1, spec, q2) => {
    // only handle local relative specifiers
    if (!spec.startsWith('./') && !spec.startsWith('../')) return full;
    // already has explicit extension we care about
    if (/\.(js|mjs|cjs|ts)$/.test(spec)) return full;

    const fileDir = path.dirname(file);
    const candidateJs = path.resolve(fileDir, spec + '.js');
    const candidateIndex = path.resolve(fileDir, spec, 'index.js');

    if (fs.existsSync(candidateJs)) {
      replaced = true;
      totalReplacements++;
      return `${pre}${q1}${spec}.js${q2}`;
    } else if (fs.existsSync(candidateIndex)) {
      replaced = true;
      totalReplacements++;
      return `${pre}${q1}${spec}/index.js${q2}`;
    } else {
      return full;
    }
  });

  if (replaced) {
    fs.writeFileSync(file, text, 'utf8');
    changedFiles.push(path.relative(process.cwd(), file));
  }
});

console.log(`ensure-js-extensions: scanned built files under ${root}`);
console.log(`ensure-js-extensions: modified ${changedFiles.length} files (${totalReplacements} replacements)`);
if (changedFiles.length) changedFiles.forEach(f => console.log('  -', f));
