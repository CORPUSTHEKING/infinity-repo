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
