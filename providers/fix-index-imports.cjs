// fix-index-imports.cjs
const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, 'src', 'index.ts'); // <-- correct path

// Map old import paths to new relative paths
const replacements = {
  "@/providers/base": "./base",
  "@/providers/streams": "./streams",
  "@/fetchers/types": "./fetchers/types",
  "@/runners/runner": "./runners/runner",
  "@/utils/context": "./utils/context",
  "@/utils/errors": "./utils/errors",
  "@/entrypoint/declare": "./entrypoint/declare",
  "@/entrypoint/builder": "./entrypoint/builder",
  "@/fetchers/standardFetch": "./fetchers/standardFetch",
  "@/fetchers/simpleProxy": "./fetchers/simpleProxy",
  "@/entrypoint/utils/targets": "./entrypoint/utils/targets",
  "@/entrypoint/providers": "./entrypoint/providers",
  "@/entrypoint/utils/meta": "./entrypoint/utils/meta",
  "@/entrypoint/utils/events": "./entrypoint/utils/events",
  "@/entrypoint/controls": "./entrypoint/controls",
  "@/entrypoint/utils/media": "./entrypoint/utils/media",
  "@/providers/base": "./base"
};

// Read file
let content = fs.readFileSync(INDEX_FILE, 'utf8');

// Replace all occurrences
for (const [oldPath, newPath] of Object.entries(replacements)) {
  const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(regex, newPath);
}

// Write back
fs.writeFileSync(INDEX_FILE, content, 'utf8');

console.log('✅ Fixed imports in src/index.ts');
