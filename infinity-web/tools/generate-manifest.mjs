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
