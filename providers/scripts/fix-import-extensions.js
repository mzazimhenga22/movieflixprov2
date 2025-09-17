// providers/scripts/fix-import-extensions.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && full.endsWith('.js')) fixFile(full);
  }
}

function fixFile(file) {
  let s = fs.readFileSync(file, 'utf8');

  // Add .js extension to relative imports/exports that currently lack extension.
  // Matches: from './something'  or from "../other/index"  but NOT package imports or already with extension.
  s = s.replace(
    /((?:import|export)\s+(?:.+?\s+from\s+)?|from\s+)(["'])(\.(?:\.\/|\/)?[^"']+?)\2/g,
    (m, before, q, p) => {
      // only handle relative paths starting with ./ or ../ or /. (we want ./ or ../)
      if (!p.startsWith('./') && !p.startsWith('../') && !p.startsWith('/')) return m;
      // if already has extension, leave it
      if (/\.[a-z0-9]+$/i.test(p)) return m;
      // if path points to directory index (ends with /index) add .js
      return `${before}${q}${p}.js${q}`;
    }
  );

  // Also handle dynamic imports: import('...') and export(...) forms
  s = s.replace(
    /(\bimport\(\s*)(["'])(\.(?:\.\/|\/)?[^"']+?)\2(\s*\))/g,
    (m, prefix, q, p, suffix) => {
      if (!p.startsWith('./') && !p.startsWith('../') && !p.startsWith('/')) return m;
      if (/\.[a-z0-9]+$/i.test(p)) return m;
      return `${prefix}${q}${p}.js${q}${suffix}`;
    }
  );

  fs.writeFileSync(file, s, 'utf8');
}

const target = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(target)) {
  console.error('lib directory not found:', target);
  process.exit(1);
}
walk(target);
console.log('fixed import extensions in', target);
