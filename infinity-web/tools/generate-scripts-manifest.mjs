import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const payloadsDir = path.join(__dirname, '../assets/payloads');
const outputFile = path.join(payloadsDir, 'manifest.json');

function buildTree(dirPath, basePath = '') {
  const tree = [];
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item === 'manifest.json' || item.startsWith('.')) continue;

      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item).replace(/\\/g, '/');
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        tree.push({
          type: 'directory',
          name: item,
          children: buildTree(fullPath, relativePath)
        });
      } else {
        tree.push({
          type: 'file',
          name: item,
          path: `assets/payloads/${relativePath}`,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
  } catch (err) {
    console.warn(`Could not read directory ${dirPath}: ${err.message}`);
  }
  return tree;
}

console.log('Generating payload manifest...');
const manifest = buildTree(payloadsDir);
fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to ${outputFile} with ${manifest.length} top-level categories.`);
