const DOCS_ROOT =
    new URL('../../docs/', import.meta.url);

const ALLOWED_DOC_ID =
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function assertMarkdownRuntime() {
    if (
        !window.marked ||
        typeof window.marked.parse !==
            'function'
    ) {
        throw new Error(
            'Marked.js is not loaded.'
        );
    }

    if (
        !window.DOMPurify ||
        typeof window.DOMPurify.sanitize !==
            'function'
    ) {
        throw new Error(
            'DOMPurify is not loaded.'
        );
    }
}

function stripFrontMatter(markdown) {
    if (
        !markdown.startsWith('---\n') &&
        !markdown.startsWith('---\r\n')
    ) {
        return markdown;
    }

    const match =
        markdown.match(
            /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
        );

    return match
        ? markdown.slice(match[0].length)
        : markdown;
}

function normalizeWikiLinks(markdown) {
    return markdown.replace(
        /!?\[\[([^\]|#]+)(?:#([^|\]]+))?(?:\|([^\]]+))?\]\]/g,
        (
            full,
            target,
            section,
            label
        ) => {
            const cleanTarget =
                String(target ?? '')
                    .trim()
                    .replace(
                        /\.(?:md|markdown)$/i,
                        ''
                    );

            if (
                !cleanTarget ||
                !ALLOWED_DOC_ID.test(
                    cleanTarget
                )
            ) {
                return full;
            }

            const text =
                String(
                    label ||
                    cleanTarget
                ).trim();

            if (full.startsWith('!')) {
                return full;
            }

            const href =
                section
                    ? `${cleanTarget}.md#${encodeURIComponent(section)}`
                    : `${cleanTarget}.md`;

            return `[${text}](${href})`;
        }
    );
}

function normalizeMarkdown(markdown) {
    let source =
        String(markdown ?? '');

    source =
        stripFrontMatter(
            source
        );

    source =
        normalizeWikiLinks(
            source
        );

    return source;
}

function sanitizeMarkdownHtml(html) {
    return window.DOMPurify.sanitize(
        html,
        {
            USE_PROFILES: {
                html: true
            },

            FORBID_TAGS: [
                'script',
                'style',
                'iframe',
                'object',
                'embed',
                'form',
                'base'
            ],

            FORBID_ATTR: [
                'onabort',
                'onauxclick',
                'onbeforeinput',
                'onbeforematch',
                'onbeforetoggle',
                'onblur',
                'oncancel',
                'oncanplay',
                'oncanplaythrough',
                'onchange',
                'onclick',
                'onclose',
                'oncontextlost',
                'oncontextmenu',
                'oncontextrestored',
                'oncopy',
                'oncuechange',
                'oncut',
                'ondblclick',
                'ondrag',
                'ondragend',
                'ondragenter',
                'ondragleave',
                'ondragover',
                'ondragstart',
                'ondrop',
                'ondurationchange',
                'onemptied',
                'onended',
                'onerror',
                'onfocus',
                'onformdata',
                'oninput',
                'oninvalid',
                'onkeydown',
                'onkeypress',
                'onkeyup',
                'onload',
                'onloadeddata',
                'onloadedmetadata',
                'onloadstart',
                'onmousedown',
                'onmouseenter',
                'onmouseleave',
                'onmousemove',
                'onmouseout',
                'onmouseover',
                'onmouseup',
                'onpaste',
                'onpause',
                'onplay',
                'onplaying',
                'onprogress',
                'onratechange',
                'onreset',
                'onresize',
                'onscroll',
                'onscrollend',
                'onsecuritypolicyviolation',
                'onseeked',
                'onseeking',
                'onselect',
                'onslotchange',
                'onstalled',
                'onsubmit',
                'onsuspend',
                'ontimeupdate',
                'ontoggle',
                'onvolumechange',
                'onwaiting',
                'onwebkitanimationend',
                'onwebkitanimationiteration',
                'onwebkitanimationstart',
                'onwebkittransitionend',
                'onwheel'
            ]
        }
    );
}

function slugifyHeading(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(
            /[^\p{L}\p{N}\s-]/gu,
            ''
        )
        .replace(
            /\s+/g,
            '-'
        )
        .replace(
            /-+/g,
            '-'
        )
        .replace(
            /^-|-$/g,
            ''
        );
}

function ensureHeadingIds(container) {
    const used =
        new Map();

    for (
        const heading of
            container.querySelectorAll(
                'h1,h2,h3,h4,h5,h6'
            )
    ) {
        const base =
            slugifyHeading(
                heading.textContent
            ) ||
            'section';

        const count =
            used.get(base) || 0;

        used.set(
            base,
            count + 1
        );

        heading.id =
            count === 0
                ? base
                : `${base}-${count + 1}`;
    }
}

function decorateGitHubAlerts(
    container
) {
    const alertTypes = new Set([
        'NOTE',
        'TIP',
        'IMPORTANT',
        'WARNING',
        'CAUTION'
    ]);

    for (
        const blockquote of
            container.querySelectorAll(
                'blockquote'
            )
    ) {
        const first =
            blockquote.querySelector(
                ':scope > p'
            );

        if (!first) {
            continue;
        }

        const text =
            first.textContent
                ?.trim() || '';

        const match =
            text.match(
                /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*(.*))?$/i
            );

        if (!match) {
            continue;
        }

        const type =
            match[1].toUpperCase();

        if (
            !alertTypes.has(type)
        ) {
            continue;
        }

        const remainder =
            match[2]
                ?.trim() || '';

        blockquote.classList.add(
            'markdown-alert',
            `markdown-alert-${type.toLowerCase()}`
        );

        const title =
            document.createElement(
                'p'
            );

        title.className =
            'markdown-alert-title';

        title.setAttribute(
            'aria-label',
            type
        );

        title.textContent =
            type.charAt(0) +
            type.slice(1).toLowerCase();

        blockquote.insertBefore(
            title,
            first
        );

        if (remainder) {
            first.textContent =
                remainder;
        } else {
            first.remove();
        }
    }
}

function rewriteDocumentReferences(
    container
) {
    for (
        const anchor of
            container.querySelectorAll(
                'a[href]'
            )
    ) {
        const href =
            anchor.getAttribute(
                'href'
            ) || '';

        if (
            href.startsWith(
                '#docs?id='
            )
        ) {
            continue;
        }

        if (
            href.startsWith(
                '#'
            )
        ) {
            continue;
        }

        if (
            /^(?:javascript|data|vbscript):/i.test(
                href
            )
        ) {
            anchor.removeAttribute(
                'href'
            );

            continue;
        }

        const hashIndex =
            href.indexOf('#');

        const withoutHash =
            hashIndex >= 0
                ? href.slice(
                      0,
                      hashIndex
                  )
                : href;

        const hash =
            hashIndex >= 0
                ? href.slice(
                      hashIndex + 1
                  )
                : '';

        if (
            /\.(?:md|markdown)$/i.test(
                withoutHash
            ) &&
            !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(
                withoutHash
            )
        ) {
            try {
                const resolved =
                    new URL(
                        withoutHash,
                        DOCS_ROOT
                    );

                if (
                    !resolved.pathname.startsWith(
                        DOCS_ROOT.pathname
                    )
                ) {
                    continue;
                }

                const relative =
                    resolved.pathname.slice(
                        DOCS_ROOT.pathname.length
                    );

                const filename =
                    relative
                        .split('/')
                        .filter(Boolean)
                        .pop() || '';

                const docId =
                    filename.replace(
                        /\.(?:md|markdown)$/i,
                        ''
                    );

                if (
                    validateDocId(
                        docId
                    )
                ) {
                    let target =
                        `#docs?id=${encodeURIComponent(docId)}`;

                    if (hash) {
                        target +=
                            `&section=${encodeURIComponent(hash)}`;
                    }

                    anchor.setAttribute(
                        'href',
                        target
                    );

                    continue;
                }
            } catch {
                // Preserve the original href.
            }
        }

        if (
            !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(
                href
            )
        ) {
            try {
                const resolved =
                    new URL(
                        href,
                        DOCS_ROOT
                    );

                anchor.setAttribute(
                    'href',
                    resolved.href
                );
            } catch {
                // Preserve malformed references.
            }
        }
    }

    for (
        const image of
            container.querySelectorAll(
                'img[src]'
            )
    ) {
        const src =
            image.getAttribute(
                'src'
            ) || '';

        if (
            !src ||
            src.startsWith(
                'data:'
            ) ||
            /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(
                src
            )
        ) {
            continue;
        }

        try {
            const resolved =
                new URL(
                    src,
                    DOCS_ROOT
                );

            image.setAttribute(
                'src',
                resolved.href
            );
        } catch {
            // Preserve malformed source.
        }
    }
}

function finalizeMarkdownDocument(
    html
) {
    const template =
        document.createElement(
            'template'
        );

    template.innerHTML =
        html;

    const container =
        template.content;

    decorateGitHubAlerts(
        container
    );

    ensureHeadingIds(
        container
    );

    rewriteDocumentReferences(
        container
    );

    return template.innerHTML;
}

export function validateDocId(
    value
) {
    return (
        typeof value ===
            'string' &&
        ALLOWED_DOC_ID.test(
            value
        )
    );
}

export function getDocumentUrl(
    docId
) {
    if (
        !validateDocId(
            docId
        )
    ) {
        throw new Error(
            'Invalid document ID.'
        );
    }

    return new URL(
        `${encodeURIComponent(docId)}.md`,
        DOCS_ROOT
    ).href;
}

export async function fetchMarkdownDocument(
    docId,
    { signal } = {}
) {
    const response =
        await fetch(
            getDocumentUrl(
                docId
            ),
            {
                signal,

                headers: {
                    Accept:
                        'text/markdown, text/plain;q=0.9, */*;q=0.8'
                }
            }
        );

    if (!response.ok) {
        const error =
            new Error(
                `Documentation request failed: ${response.status}`
            );

        error.status =
            response.status;

        throw error;
    }

    return response.text();
}

export function renderMarkdown(
    rawMarkdown
) {
    assertMarkdownRuntime();

    const source =
        normalizeMarkdown(
            rawMarkdown
        );

    const rendered =
        window.marked.parse(
            source,
            {
                gfm: true,
                breaks: false,
                pedantic: false,
                async: false
            }
        );

    const sanitized =
        sanitizeMarkdownHtml(
            rendered
        );

    return finalizeMarkdownDocument(
        sanitized
    );
}
