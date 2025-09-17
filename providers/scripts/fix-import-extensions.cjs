// providers/scripts/fix-import-extensions.cjs
const fs = require('fs');
const path = require('path');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function ensureJsExt(p) {
  if (/\.[a-z0-9]+$/i.test(p)) return p;
  return p + '.js';
}

// Given importer file path and a target absolute file path, compute a safe relative specifier
function relSpecifier(importerFile, targetAbs) {
  const importerDir = path.dirname(importerFile);
  let rel = path.relative(importerDir, targetAbs);
  rel = toPosix(rel);
  if (!rel.startsWith('.') && !rel.startsWith('/')) rel = './' + rel;
  return rel;
}

function fixFile(file, libRoot) {
  let s = fs.readFileSync(file, 'utf8');

  // 1) Fix relative import/export specifiers first (./ or ../)
  s = s.replace(
    /((?:import|export)\s+(?:.+?\s+from\s+)?|from\s+|import\()\s*(["'])(\.{1,2}\/[^"')]+?)\2(\s*\)?)/g,
    (m, before, q, p, after) => {
      const targetCandidate = path.resolve(path.dirname(file), p);
      // If targetCandidate is a directory with index.js or a file with .ts/.js, find the actual .js path
      const possibilities = [
        targetCandidate + '.js',
        path.join(targetCandidate, 'index.js'),
        targetCandidate.replace(/\.ts$/, '.js'),
      ];
      let found = null;
      for (const cand of possibilities) {
        if (fs.existsSync(cand)) {
          found = cand;
          break;
        }
      }
      if (found) {
        const rel = relSpecifier(file, found);
        return before + q + rel + q + after;
      }
      // fallback: just add .js to original specifier
      return before + q + ensureJsExt(p) + q + after;
    }
  );

  // 2) Fix dynamic imports like import('something')
  s = s.replace(
    /(\bimport\(\s*)(["'])(\.{1,2}\/[^"')]+?)\2(\s*\))/g,
    (m, pre, q, p, post) => {
      const targetCandidate = path.resolve(path.dirname(file), p);
      const possibilities = [targetCandidate + '.js', path.join(targetCandidate, 'index.js'), targetCandidate.replace(/\.ts$/, '.js')];
      let found = null;
      for (const cand of possibilities) {
        if (fs.existsSync(cand)) {
          found = cand;
          break;
        }
      }
      if (found) {
        const rel = relSpecifier(file, found);
        return pre + q + rel + q + post;
      }
      return pre + q + ensureJsExt(p) + q + post;
    }
  );

  // 3) Now handle non-relative specifiers (like "utils/errors" or "@/utils/errors" already should be transformed by tsc-alias)
  // Find import/export statements with bare or package-like specifiers
  s = s.replace(
    /((?:import|export)\s+(?:.+?\s+from\s+)?|from\s+|import\()\s*(["'])(?![./])([^"')]+?)\2(\s*\)?)/g,
    (m, before, q, p, after) => {
      // Candidate absolute path inside libRoot
      const candidateFiles = [
        path.join(libRoot, p + '.js'),
        path.join(libRoot, p, 'index.js'),
      ];
      let found = null;
      for (const cand of candidateFiles) {
        if (fs.existsSync(cand)) {
          found = cand;
          break;
        }
      }
      if (found) {
        const rel = relSpecifier(file, found);
        return before + q + rel + q + after;
      }
      // not something we can resolve (likely a real package), leave unchanged
      return m;
    }
  );

  fs.writeFileSync(file, s, 'utf8');
}

function walk(dir, libRoot) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, libRoot);
    else if (e.isFile() && full.endsWith('.js')) fixFile(full, libRoot);
  }
}

const libRoot = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libRoot)) {
  console.error('lib directory not found:', libRoot);
  process.exit(1);
}
walk(libRoot, libRoot);
console.log('fixed import extensions and converted bare specifiers in', libRoot);
