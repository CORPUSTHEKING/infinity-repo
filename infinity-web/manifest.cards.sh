#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

mkdir -p tools components

cat > tools/generate-manifest.mjs <<'EOF'
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAYLOADS_DIR = path.join(ROOT, 'assets', 'payloads');
const MARKDOWN_DOCS_DIR = path.join(ROOT, 'assets', 'docs');
const DATA_DOCS_DIR = path.join(ROOT, 'data', 'docs');

const MANIFEST_OUTPUT = path.join(PAYLOADS_DIR, 'manifest.json');
const DOCS_COMPAT_OUTPUT = path.join(PAYLOADS_DIR, 'docs-manifest.json');

const DESCRIPTION_MAX_LENGTH = 220;
const GENERATOR_VERSION = '2.0.0';

const GENERATED_FILENAMES = new Set([
  'manifest.json',
  'docs-manifest.json'
]);

const DEFAULT_DOC_TITLE = 'Script Documentation';

function log(message) {
  console.log(`[Manifest] ${message}`);
}

function warn(message) {
  console.warn(`[Manifest] WARNING: ${message}`);
}

function fail(message, cause) {
  const error = new Error(message, { cause });
  error.name = 'ManifestBuildError';
  throw error;
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function normalizeRelativePath(value) {
  const normalized = String(value ?? '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');

  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('\0')
  ) {
    fail(`Unsafe relative path: ${JSON.stringify(value)}`);
  }

  const parts = normalized.split('/');

  if (
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..'
    )
  ) {
    fail(`Unsafe relative path: ${JSON.stringify(value)}`);
  }

  return parts.join('/');
}

function stripExtension(name) {
  return String(name).replace(/\.[^/.]+$/, '');
}

function normalizeId(value) {
  return stripExtension(path.basename(String(value))).trim();
}

function compactWhitespace(value) {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateDescription(
  value,
  maxLength = DESCRIPTION_MAX_LENGTH
) {
  const text = compactWhitespace(value);

  if (text.length <= maxLength) {
    return text;
  }

  const hardLimit = Math.max(1, maxLength - 1);
  const clipped = text.slice(0, hardLimit);
  const lastSpace = clipped.lastIndexOf(' ');
  const boundary =
    lastSpace >= Math.floor(hardLimit * 0.55)
      ? lastSpace
      : hardLimit;

  return `${clipped.slice(0, boundary).trimEnd()}…`;
}

function stripMarkdownInline(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^\s*[-+*]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .trim();
}

function extractMarkdownDescription(markdown) {
  let source = String(markdown ?? '')
    .replace(/\r\n?/g, '\n');

  source = source.replace(
    /^---\s*\n[\s\S]*?\n---\s*\n?/u,
    ''
  );

  source = source.replace(
    /<!--[\s\S]*?-->/g,
    ''
  );

  const lines = source.split('\n');

  let paragraph = [];
  let inFence = false;

  const flush = () => {
    if (!paragraph.length) {
      return '';
    }

    const candidate = compactWhitespace(
      paragraph.join(' ')
    );

    paragraph = [];

    if (!candidate) {
      return '';
    }

    return truncateDescription(
      stripMarkdownInline(candidate)
    );
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    if (!line) {
      const candidate = flush();

      if (candidate) {
        return candidate;
      }

      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      if (paragraph.length) {
        const candidate = flush();

        if (candidate) {
          return candidate;
        }
      }

      continue;
    }

    if (/^\|/.test(line)) {
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      continue;
    }

    if (/^.+:\s+\S+/.test(line)) {
      continue;
    }

    if (/^>\s*$/.test(line)) {
      continue;
    }

    paragraph.push(line);
  }

  return flush();
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    );
  } catch (error) {
    fail(
      `Invalid JSON: ${path.relative(ROOT, filePath)}`,
      error
    );
  }
}

function walkRegularFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const results = [];

  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        undefined,
        { sensitivity: 'base' }
      )
    );

  for (const entry of entries) {
    const absolute = path.join(
      directory,
      entry.name
    );

    if (entry.isSymbolicLink()) {
      warn(
        `Ignoring symbolic link: ${path.relative(
          ROOT,
          absolute
        )}`
      );
      continue;
    }

    if (entry.isDirectory()) {
      results.push(
        ...walkRegularFiles(absolute)
      );
      continue;
    }

    if (entry.isFile()) {
      results.push(absolute);
    }
  }

  return results;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');

  hash.update(
    fs.readFileSync(filePath)
  );

  return hash.digest('hex');
}

function readMarkdownDocs() {
  const docsById = new Map();

  for (const filePath of walkRegularFiles(
    MARKDOWN_DOCS_DIR
  )) {
    const relative = normalizeRelativePath(
      path.relative(
        MARKDOWN_DOCS_DIR,
        filePath
      )
    );

    const relativeParts = relative.split('/');
    const fileName = relativeParts.at(-1);

    if (!fileName.toLowerCase().endsWith('.md')) {
      continue;
    }

    const id = normalizeId(fileName);

    if (!id) {
      continue;
    }

    const markdown = fs.readFileSync(
      filePath,
      'utf8'
    );

    const description =
      extractMarkdownDescription(markdown);

    if (relativeParts.length !== 1) {
      warn(
        `Documentation is nested and will not receive a router link: ${relative}`
      );
    }

    if (docsById.has(id)) {
      fail(
        `Duplicate documentation id "${id}"`
      );
    }

    docsById.set(id, {
      slug: id,
      title: DEFAULT_DOC_TITLE,
      description,
      preview: description,
      markdownPath: `assets/docs/${relative}`,
      routeAvailable: relativeParts.length === 1,
      pageUrl:
        relativeParts.length === 1
          ? `#docs?id=${encodeURIComponent(id)}`
          : null,
      source: 'markdown'
    });
  }

  return docsById;
}

function readJsonDocs(existingDocsById) {
  const result = new Map(existingDocsById);

  for (const filePath of walkRegularFiles(
    DATA_DOCS_DIR
  )) {
    if (!filePath.toLowerCase().endsWith('.json')) {
      continue;
    }

    const relative = normalizeRelativePath(
      path.relative(
        DATA_DOCS_DIR,
        filePath
      )
    );

    const fileName = relative
      .split('/')
      .at(-1);

    const slug = stripExtension(fileName);

    const content = readJsonFile(filePath);

    if (
      !content ||
      typeof content !== 'object' ||
      Array.isArray(content)
    ) {
      fail(
        `Documentation metadata must be an object: data/docs/${relative}`
      );
    }

    const existing =
      result.get(slug) ?? {};

    const markdownDescription =
      existing.description || '';

    const title = compactWhitespace(
      content.title ||
      existing.title ||
      slug
    );

    const preview = truncateDescription(
      markdownDescription ||
      content.description ||
      content.preview ||
      content.summary ||
      ''
    );

    const originalLink =
      typeof content.link === 'string'
        ? content.link.trim()
        : '';

    result.set(slug, {
      ...existing,
      ...content,

      slug,
      title,

      description: preview,
      preview,

      link:
        originalLink ||
        existing.pageUrl ||
        `#docs?id=${encodeURIComponent(slug)}`,

      pageUrl:
        existing.pageUrl ||
        (
          originalLink.startsWith('#docs?id=')
            ? originalLink
            : null
        ),

      source: existing.source
        ? `${existing.source}+metadata`
        : 'metadata'
    });
  }

  return result;
}

function buildDocsIndex() {
  return readJsonDocs(
    readMarkdownDocs()
  );
}

function buildDocCompatibilityManifest(
  docsById
) {
  return [...docsById.values()]
    .map((doc) => ({
      title:
        doc.title ||
        doc.slug ||
        DEFAULT_DOC_TITLE,

      preview: truncateDescription(
        doc.description ||
        doc.preview ||
        ''
      ),

      description: truncateDescription(
        doc.description ||
        doc.preview ||
        ''
      ),

      link:
        doc.pageUrl ||
        doc.link ||
        `#docs?id=${encodeURIComponent(
          doc.slug
        )}`,

      slug: doc.slug,

      path:
        doc.markdownPath ||
        null,

      available: Boolean(
        doc.markdownPath
      )
    }))
    .sort((a, b) =>
      a.slug.localeCompare(
        b.slug
      )
    );
}

function mergeFileDocumentation(
  fileRecord,
  docsById
) {
  const doc = docsById.get(
    fileRecord.id
  );

  if (!doc) {
    return {
      ...fileRecord,

      description: '',
      summary: '',

      pageUrl: null,
      docPath: null,

      hasDocumentation: false
    };
  }

  const description =
    truncateDescription(
      doc.description ||
      doc.preview ||
      ''
    );

  return {
    ...fileRecord,

    description,
    summary: description,

    pageUrl:
      doc.routeAvailable
        ? doc.pageUrl
        : null,

    docPath:
      doc.markdownPath ||
      null,

    hasDocumentation:
      Boolean(doc.markdownPath),

    documentationTitle:
      doc.title || null
  };
}

function buildPayloadTree(
  directory,
  docsById,
  options = {}
) {
  const basePath =
    options.basePath || '';

  const topCategory =
    options.topCategory || null;

  const registry =
    options.registry || new Map();

  if (!fs.existsSync(directory)) {
    fail(
      `Payload directory does not exist: ${path.relative(
        ROOT,
        directory
      )}`
    );
  }

  const entries = fs
    .readdirSync(
      directory,
      { withFileTypes: true }
    )
    .filter(
      (entry) =>
        !entry.name.startsWith('.')
    )
    .filter(
      (entry) =>
        !GENERATED_FILENAMES.has(
          entry.name
        )
    )
    .sort((a, b) => {
      if (
        a.isDirectory() !==
        b.isDirectory()
      ) {
        return a.isDirectory() ? -1 : 1;
      }

      return a.name.localeCompare(
        b.name,
        undefined,
        { sensitivity: 'base' }
      );
    });

  return entries.flatMap((entry) => {
    const absolute = path.join(
      directory,
      entry.name
    );

    const relative =
      normalizeRelativePath(
        path.posix.join(
          basePath,
          entry.name
        )
      );

    if (entry.isSymbolicLink()) {
      warn(
        `Ignoring symbolic link: ${relative}`
      );
      return [];
    }

    if (entry.isDirectory()) {
      const category =
        topCategory ||
        entry.name;

      const children =
        buildPayloadTree(
          absolute,
          docsById,
          {
            basePath: relative,
            topCategory: category,
            registry
          }
        );

      return [
        {
          type: 'directory',
          name: entry.name,
          path: relative,
          category,
          children
        }
      ];
    }

    if (!entry.isFile()) {
      return [];
    }

    const id = normalizeId(
      entry.name
    );

    if (!id) {
      warn(
        `Skipping file with empty id: ${relative}`
      );
      return [];
    }

    if (registry.has(id)) {
      fail(
        `Duplicate script id "${id}" found at ` +
        `"${registry.get(id).path}" and "${relative}". ` +
        'Script ids must be unique because they are used by the router and card actions.'
      );
    }

    const stat = fs.statSync(
      absolute
    );

    const category =
      topCategory ||
      entry.name;

    const record =
      mergeFileDocumentation(
        {
          type: 'file',

          id,
          name: entry.name,
          path: relative,

          size: stat.size,

          modified:
            stat.mtime.toISOString(),

          sha256:
            sha256File(absolute),

          category,

          categoryPath:
            relative.includes('/')
              ? relative
                  .split('/')
                  .slice(0, -1)
                  .join('/')
              : category
        },
        docsById
      );

    registry.set(id, record);

    return [record];
  });
}

function writeJsonAtomic(
  filePath,
  value
) {
  const directory =
    path.dirname(filePath);

  ensureDirectory(directory);

  const tempPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  const json =
    `${JSON.stringify(value, null, 2)}\n`;

  try {
    fs.writeFileSync(
      tempPath,
      json,
      {
        encoding: 'utf8',
        mode: 0o644
      }
    );

    fs.renameSync(
      tempPath,
      filePath
    );
  } catch (error) {
    try {
      fs.rmSync(
        tempPath,
        { force: true }
      );
    } catch {
      // Preserve original failure.
    }

    fail(
      `Could not write ${path.relative(
        ROOT,
        filePath
      )}`,
      error
    );
  }
}

export async function generateUnifiedManifest(
  { write = true } = {}
) {
  ensureDirectory(PAYLOADS_DIR);

  const startedAt = Date.now();

  const docsById =
    buildDocsIndex();

  const registry =
    new Map();

  const tree =
    buildPayloadTree(
      PAYLOADS_DIR,
      docsById,
      { registry }
    );

  const scripts =
    [...registry.values()]
      .sort((a, b) => {
        const categoryCompare =
          a.category.localeCompare(
            b.category,
            undefined,
            { sensitivity: 'base' }
          );

        if (categoryCompare !== 0) {
          return categoryCompare;
        }

        return a.path.localeCompare(
          b.path
        );
      });

  const docs =
    buildDocCompatibilityManifest(
      docsById
    );

  const meta = {
    schemaVersion: 2,
    generatorVersion:
      GENERATOR_VERSION,

    generatedAt:
      new Date().toISOString(),

    scriptCount:
      scripts.length,

    documentationCount:
      docs.length,

    documentedScriptCount:
      scripts.filter(
        (item) =>
          item.hasDocumentation
      ).length
  };

  if (write) {
    writeJsonAtomic(
      MANIFEST_OUTPUT,
      tree
    );

    writeJsonAtomic(
      DOCS_COMPAT_OUTPUT,
      docs
    );
  }

  const durationMs =
    Date.now() - startedAt;

  log(
    `Generated ${scripts.length} scripts, ` +
    `${meta.documentedScriptCount} with Markdown documentation, ` +
    `${docs.length} documentation entries in ${durationMs}ms.`
  );

  return {
    tree,
    scripts,
    docs,
    meta,

    files: {
      manifest:
        MANIFEST_OUTPUT,

      docsCompatibility:
        DOCS_COMPAT_OUTPUT
    }
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url);

if (isMain) {
  generateUnifiedManifest({
    write: true
  }).catch((error) => {
    console.error(
      `[Manifest] ERROR: ${error.message}`
    );

    if (error.cause) {
      console.error(
        error.cause
      );
    }

    process.exitCode = 1;
  });
}
EOF

cat > tools/generate-scripts-manifest.mjs <<'EOF'
import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Scripts] Manifest ready: ${result.scripts.length} scripts; ` +
  `${result.meta.documentedScriptCount} documented.`
);
EOF

cat > tools/generate-docs-manifest.mjs <<'EOF'
import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Docs] Compatibility manifest ready: ${result.docs.length} documentation entries.`
);
EOF

cat > components/cards.js <<'EOF'
import { Icons } from './icons.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(
  value,
  fallback = ''
) {
  const text =
    String(value ?? '').trim();

  return text || fallback;
}

function normalizeDocUrl(item) {
  const candidate =
    String(
      item?.pageUrl ?? ''
    ).trim();

  if (
    candidate.startsWith(
      '#docs?id='
    )
  ) {
    return candidate;
  }

  const id =
    String(
      item?.id ?? ''
    ).trim();

  return id
    ? `#docs?id=${encodeURIComponent(id)}`
    : '';
}

function renderDescription(item) {
  const description =
    normalizeText(
      item?.description,
      normalizeText(
        item?.summary,
        'No description provided.'
      )
    );

  const docUrl =
    normalizeDocUrl(item);

  const hasDocumentation =
    Boolean(
      item?.hasDocumentation &&
      docUrl
    );

  return `
    <button
      type="button"
      class="inf-card-body${hasDocumentation ? '' : ' is-disabled'}"
      data-script-expand
      ${hasDocumentation
        ? `data-doc-url="${escapeHtml(docUrl)}"`
        : 'disabled aria-disabled="true"'}
      aria-label="${escapeHtml(
        hasDocumentation
          ? `Open documentation for ${normalizeText(
              item?.name,
              'script'
            )}`
          : 'Documentation unavailable'
      )}"
    >
      <p>${escapeHtml(description)}</p>

      <span
        class="inf-card-doc-hint"
        aria-hidden="true"
      >
        ${
          hasDocumentation
            ? 'Open documentation'
            : 'Documentation unavailable'
        }
      </span>
    </button>
  `;
}

export function renderScriptCards(
  items = []
) {
  const safeItems =
    Array.isArray(items)
      ? items
      : [];

  return `
    <div
      class="inf-cards-rail"
      aria-label="Scripts"
    >
      ${
        safeItems.length
          ? safeItems
              .map((item) => {
                const id =
                  escapeHtml(
                    item?.id || ''
                  );

                const author =
                  escapeHtml(
                    normalizeText(
                      item?.author,
                      normalizeText(
                        item?.owner,
                        'INFINITY'
                      )
                    )
                  );

                const name =
                  escapeHtml(
                    normalizeText(
                      item?.name,
                      normalizeText(
                        item?.title,
                        'Untitled script'
                      )
                    )
                  );

                const shell =
                  escapeHtml(
                    item?.shell || ''
                  );

                const language =
                  escapeHtml(
                    item?.language || ''
                  );

                const category =
                  escapeHtml(
                    item?.category || ''
                  );

                const dependencies =
                  Array.isArray(
                    item?.dependencies
                  )
                    ? item.dependencies
                        .map((dependency) =>
                          String(dependency)
                        )
                        .join('\n')
                    : String(
                        item?.dependencies || ''
                      );

                return `
                  <article
                    class="inf-card"
                    data-script-card
                    data-script-id="${id}"
                  >
                    <header class="inf-card-head">
                      <div class="inf-card-author">
                        ${author}
                      </div>

                      <h3 class="inf-card-title">
                        ${name}
                      </h3>
                    </header>

                    ${renderDescription(item)}

                    <footer class="inf-card-foot">
                      <div class="inf-card-meta">
                        <span>${shell}</span>
                        <span>${language}</span>
                        <span>${category}</span>
                      </div>

                      <div class="inf-card-actions">
                        <button
                          type="button"
                          data-action="download"
                          title="Download ${name}"
                          aria-label="Download ${name}"
                        >
                          ${Icons.download}
                        </button>

                        <button
                          type="button"
                          data-action="share"
                          title="Share ${name}"
                          aria-label="Share ${name}"
                        >
                          ${Icons.share}
                        </button>

                        <button
                          type="button"
                          data-action="request"
                          title="Request ${name}"
                          aria-label="Request ${name}"
                        >
                          ${Icons.request}
                        </button>

                        <button
                          type="button"
                          data-action="report"
                          title="Report ${name}"
                          aria-label="Report ${name}"
                        >
                          ${Icons.report}
                        </button>
                      </div>

                      ${
                        dependencies
                          ? `
                            <pre class="inf-card-deps">
${escapeHtml(dependencies)}
                            </pre>
                          `
                          : ''
                      }
                    </footer>
                  </article>
                `;
              })
              .join('')
          : `
              <div class="inf-result">
                No scripts loaded yet.
              </div>
            `
      }
    </div>
  `;
}

export {
  escapeHtml
};
EOF

cat > components/cardActions.js <<'EOF'
/**
 * Component: Card Actions
 *
 * Responsibilities:
 * - Handle script-card actions through delegation.
 * - Open generated documentation hashes.
 * - Keep action handlers injectable.
 * - Prevent unsafe download/path construction.
 */

function normalizeHashTarget(value) {
  const raw =
    String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  if (raw.startsWith('#')) {
    return raw;
  }

  if (
    /^(?:javascript|data|vbscript):/i.test(
      raw
    )
  ) {
    return null;
  }

  return `#${raw.replace(/^#+/, '')}`;
}

function safeRelativePath(value) {
  const raw =
    String(value ?? '')
      .replace(/\\/g, '/')
      .trim();

  if (
    !raw ||
    raw.startsWith('/') ||
    raw.includes('\0')
  ) {
    return null;
  }

  const parts =
    raw.split('/').filter(Boolean);

  if (
    parts.some(
      (part) =>
        part === '.' ||
        part === '..' ||
        part.includes(':')
    )
  ) {
    return null;
  }

  return parts.join('/');
}

function encodePathSegments(value) {
  const safePath =
    safeRelativePath(value);

  if (!safePath) {
    return null;
  }

  return safePath
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment)
    )
    .join('/');
}

function triggerVisualFeedback(
  button,
  state
) {
  const previousTimer =
    state.loadingTimers.get(
      button
    );

  if (previousTimer) {
    clearTimeout(
      previousTimer
    );
  }

  button.classList.add(
    'btn-loading'
  );

  const timer =
    window.setTimeout(() => {
      button.classList.remove(
        'btn-loading'
      );

      state.loadingTimers.delete(
        button
      );
    }, 800);

  state.loadingTimers.set(
    button,
    timer
  );
}

function navigateToHash(
  target
) {
  const hash =
    normalizeHashTarget(target);

  if (
    !hash ||
    typeof window === 'undefined' ||
    !window.location
  ) {
    return false;
  }

  window.location.hash =
    hash.slice(1);

  return true;
}

export function bindCardActions(
  root,
  handlers = {}
) {
  if (
    !root ||
    typeof root.addEventListener !==
      'function'
  ) {
    return () => {};
  }

  const state = {
    loadingTimers: new Map()
  };

  const onClick = (event) => {
    const target =
      event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const expandButton =
      target.closest(
        '[data-script-expand]'
      );

    const actionButton =
      target.closest(
        '[data-action]'
      );

    const card =
      target.closest(
        '[data-script-card]'
      );

    if (
      !card ||
      !root.contains(card)
    ) {
      return;
    }

    const itemId =
      card.getAttribute(
        'data-script-id'
      ) || '';

    if (expandButton) {
      if (
        expandButton.hasAttribute(
          'disabled'
        )
      ) {
        return;
      }

      const docUrl =
        expandButton.getAttribute(
          'data-doc-url'
        );

      if (
        typeof handlers.onExpand ===
          'function'
      ) {
        const result =
          handlers.onExpand(
            itemId,
            card,
            docUrl
          );

        if (
          result === true ||
          result === false
        ) {
          return;
        }
      }

      if (docUrl) {
        navigateToHash(
          docUrl
        );
      }

      return;
    }

    if (!actionButton) {
      return;
    }

    const action =
      actionButton.getAttribute(
        'data-action'
      ) || '';

    triggerVisualFeedback(
      actionButton,
      state
    );

    if (
      typeof handlers.onAction ===
        'function'
    ) {
      handlers.onAction(
        action,
        itemId,
        card
      );
    }
  };

  root.addEventListener(
    'click',
    onClick
  );

  return () => {
    root.removeEventListener(
      'click',
      onClick
    );

    for (
      const timer of
        state.loadingTimers.values()
    ) {
      clearTimeout(timer);
    }

    state.loadingTimers.clear();
  };
}

export function handleDownload(
  itemNode,
  siteConfig = {}
) {
  if (
    !itemNode ||
    itemNode.type ===
      'directory'
  ) {
    console.error(
      '[Infinity] Download failed: a regular file item is required.'
    );

    return false;
  }

  const encodedPath =
    encodePathSegments(
      itemNode.path
    );

  if (!encodedPath) {
    console.error(
      '[Infinity] Download failed: invalid payload path.'
    );

    return false;
  }

  let payloadBase =
    String(
      siteConfig?.payloadBase ||
      siteConfig?.paths?.payloads ||
      'assets/payloads'
    ).trim();

  if (
    !payloadBase ||
    payloadBase.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(
      payloadBase
    )
  ) {
    payloadBase =
      'assets/payloads';
  }

  payloadBase =
    payloadBase.replace(
      /^\/+|\/+$/g,
      ''
    );

  const downloadUrl =
    new URL(
      `${payloadBase}/${encodedPath}`,
      document.baseURI
    ).href;

  const link =
    document.createElement(
      'a'
    );

  link.href =
    downloadUrl;

  link.download =
    String(
      itemNode.name ||
      itemNode.id ||
      'download'
    );

  link.rel =
    'noopener';

  link.style.display =
    'none';

  document.body.appendChild(
    link
  );

  try {
    link.click();

    console.log(
      `[Infinity] Triggered download: ${downloadUrl}`
    );

    return true;
  } finally {
    link.remove();
  }
}

export function handleDirectoryDownload(
  itemNode,
  siteConfig = {}
) {
  if (
    !itemNode ||
    itemNode.type !==
      'directory'
  ) {
    return false;
  }

  const encodedPath =
    encodePathSegments(
      itemNode.path
    );

  if (!encodedPath) {
    console.error(
      '[Infinity] Directory download failed: invalid payload path.'
    );

    return false;
  }

  const repoUrl =
    String(
      siteConfig?.repoUrl ||
      'https://github.com/CORPUSTHEKING/infinity'
    ).replace(
      /\/+$/,
      ''
    );

  const branch =
    encodeURIComponent(
      String(
        siteConfig?.branch ||
        'main'
      )
    );

  const githubUrl =
    `${repoUrl}/tree/${branch}/infinity-web/assets/payloads/${encodedPath}`;

  const confirmed =
    window.confirm(
      `Directory: "${itemNode.name || 'Unnamed'}"\n\n` +
      'Browsers cannot natively download folders. Open the directory on GitHub?'
    );

  if (!confirmed) {
    return false;
  }

  window.open(
    githubUrl,
    '_blank',
    'noopener,noreferrer'
  );

  return true;
}
EOF

cat > components/categories.js <<'EOF'
import {
  renderScriptCards
} from './cards.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTree(
  manifest = []
) {
  if (Array.isArray(manifest)) {
    return manifest;
  }

  if (
    manifest &&
    Array.isArray(
      manifest.scripts
    )
  ) {
    return manifest.scripts;
  }

  if (
    manifest &&
    Array.isArray(
      manifest.tree
    )
  ) {
    return manifest.tree;
  }

  return [];
}

function collectFiles(
  nodes,
  bucket = [],
  context = {}
) {
  for (
    const node of
      getTree(nodes)
  ) {
    if (
      !node ||
      typeof node !== 'object'
    ) {
      continue;
    }

    if (
      node.type === 'file'
    ) {
      bucket.push({
        ...node,

        category:
          node.category ||
          context.category ||
          'UNCATEGORIZED',

        categoryPath:
          node.categoryPath ||
          context.path ||
          node.category ||
          'UNCATEGORIZED'
      });

      continue;
    }

    if (
      node.type ===
        'directory' &&
      Array.isArray(
        node.children
      )
    ) {
      collectFiles(
        node.children,
        bucket,
        {
          category:
            node.category ||
            context.category ||
            node.name ||
            'UNCATEGORIZED',

          path:
            node.path ||
            context.path ||
            node.name ||
            'UNCATEGORIZED'
        }
      );
    }
  }

  return bucket;
}

function groupFilesByCategory(
  tree
) {
  const groups =
    new Map();

  for (
    const file of
      collectFiles(tree)
  ) {
    const key =
      String(
        file.category ||
        'UNCATEGORIZED'
      );

    if (
      !groups.has(key)
    ) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(key)
      .push(file);
  }

  for (
    const files of
      groups.values()
  ) {
    files.sort(
      (a, b) =>
        String(
          a.path ||
          a.name ||
          ''
        ).localeCompare(
          String(
            b.path ||
            b.name ||
            ''
          ),
          undefined,
          {
            sensitivity:
              'base'
          }
        )
    );
  }

  return [
    ...groups.entries()
  ].sort(
    ([a], [b]) =>
      a.localeCompare(
        b,
        undefined,
        {
          sensitivity:
            'base'
        }
      )
  );
}

function matchesQuery(
  item,
  query
) {
  const q =
    String(
      query ?? ''
    )
      .trim()
      .toLowerCase();

  if (!q) {
    return true;
  }

  const haystack = [
    item.id,
    item.name,
    item.title,
    item.description,
    item.summary,
    item.category,
    item.categoryPath,
    item.shell,
    item.language
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function renderCategoriesView(
  tree = [],
  { query = '' } = {}
) {
  const groups =
    groupFilesByCategory(tree)
      .map(
        ([category, files]) => [
          category,
          files.filter(
            (item) =>
              matchesQuery(
                item,
                query
              )
          )
        ]
      )
      .filter(
        ([, files]) =>
          files.length > 0
      );

  if (!groups.length) {
    return `
      <div class="wrap">
        <section>
          <div class="empty">
            No scripts match the current query.
          </div>
        </section>
      </div>
    `;
  }

  return `
    <div class="wrap">
      ${groups
        .map(
          ([category, files]) => {
            const heading =
              escapeHtml(
                String(
                  category
                ).toUpperCase()
              );

            return `
              <section
                data-script-category="${escapeHtml(
                  category
                )}"
              >
                <div class="section-head">
                  <div>
                    <h2>${heading}</h2>
                    <p>
                      Script tools available in this category.
                    </p>
                  </div>

                  <div class="pill-row">
                    <span class="pill">
                      ${files.length}
                      ${files.length === 1 ? 'SCRIPT' : 'SCRIPTS'}
                      LOADED
                    </span>
                  </div>
                </div>

                <div class="grid">
                  ${renderScriptCards(
                    files
                  )}
                </div>
              </section>
            `;
          }
        )
        .join('')}
    </div>
  `;
}

export function renderSearchResultsView(
  results = [],
  query = ''
) {
  const safeResults =
    Array.isArray(results)
      ? results.filter(
          (item) =>
            matchesQuery(
              item,
              query
            )
        )
      : [];

  return `
    <div class="wrap">
      <section>
        <div class="section-head">
          <div>
            <h2>Search Results</h2>

            <p>
              Matching scripts for your search query.
            </p>
          </div>

          <div class="pill-row">
            <span class="pill">
              ${safeResults.length}
              ${
                safeResults.length === 1
                  ? 'MATCH'
                  : 'MATCHES'
              }
            </span>
          </div>
        </div>

        ${
          safeResults.length
            ? `
              <div class="grid">
                ${renderScriptCards(
                  safeResults
                )}
              </div>
            `
            : `
              <div class="empty">
                No Script Templates match your search query.
              </div>
            `
        }
      </section>
    </div>
  `;
}

export {
  collectFiles
};
EOF

cat > tools/build.mjs <<'EOF'
import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

console.log(
  '[Build] Starting Infinity Web build metadata generation...'
);

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Build] Complete: ${result.meta.scriptCount} scripts, ` +
  `${result.meta.documentedScriptCount} documented, ` +
  `${result.meta.documentationCount} documentation entries.`
);
EOF

cat > tools/rebuild-scripts.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(
  cd -- "$(dirname -- "$0")/.." &&
  pwd
)"

cd "$ROOT_DIR"

exec node tools/build.mjs
EOF

cat > package.json <<'EOF'
{
  "name": "infinity-terminal-helpers",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "node tools/build.mjs",
    "build:manifest": "node tools/generate-manifest.mjs",
    "manifest": "node tools/generate-manifest.mjs"
  }
}
EOF

chmod +x tools/rebuild-scripts.sh

echo '[Apply] Syntax checks...'

for file in \
  tools/generate-manifest.mjs \
  tools/generate-scripts-manifest.mjs \
  tools/generate-docs-manifest.mjs \
  tools/build.mjs \
  components/cards.js \
  components/cardActions.js \
  components/categories.js
do
  node --check "$file"
done

bash -n tools/rebuild-scripts.sh

echo '[Apply] Running build...'

node tools/build.mjs

echo '[Apply] Done.'
