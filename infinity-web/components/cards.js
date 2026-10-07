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
