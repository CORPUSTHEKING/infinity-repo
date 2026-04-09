import fs from 'fs';
import path from 'path';

const DOCS_DIR = './data/docs';
const OUTPUT = './assets/payloads/docs-manifest.json';

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

const docs = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
        const content = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, f), 'utf8'));
        return { ...content, slug: f.replace('.json', '') };
    });

fs.writeFileSync(OUTPUT, JSON.stringify(docs, null, 2));
console.log(`[Docs] Manifest generated: ${docs.length} entries.`);
