const DOCS_ROOT = new URL('../../docs/', import.meta.url);
const ALLOWED_DOC_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function assertMarkdownRuntime() {
    if (!window.marked || typeof window.marked.parse !== 'function') {
        throw new Error('Marked.js is not loaded.');
    }

    if (!window.DOMPurify || typeof window.DOMPurify.sanitize !== 'function') {
        throw new Error('DOMPurify is not loaded.');
    }
}

function stripFrontMatter(markdown) {
    if (!markdown.startsWith('---\n') && !markdown.startsWith('---\r\n')) {
        return markdown;
    }

    const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);

    return match
        ? markdown.slice(match[0].length)
        : markdown;
}

function isExternalReference(value) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function isDocumentReference(value) {
    return /\.(?:md|markdown)(?:[?#].*)?$/i.test(value);
}

function resolveDocumentId(reference) {
    try {
        const cleanReference = reference
            .split('#', 1)[0]
            .split('?', 1)[0];

        const url = new URL(cleanReference, DOCS_ROOT);

        const relative = url.pathname.startsWith(DOCS_ROOT.pathname)
            ? url.pathname.slice(DOCS_ROOT.pathname.length)
            : '';

        const fileName = relative
            .split('/')
            .filter(Boolean)
            .pop() || '';

        const docId = fileName.replace(
            /\.(?:md|markdown)$/i,
            ''
        );

        return ALLOWED_DOC_ID.test(docId)
            ? docId
            : null;
    } catch {
        return null;
    }
}

function toSpaDocumentHref(reference) {
    const hashIndex = reference.indexOf('#');

    const hash = hashIndex >= 0
        ? reference.slice(hashIndex + 1)
        : '';

    const beforeHash = hashIndex >= 0
        ? reference.slice(0, hashIndex)
        : reference;

    const queryIndex = beforeHash.indexOf('?');

    const pathPart = queryIndex >= 0
        ? beforeHash.slice(0, queryIndex)
        : beforeHash;

    const docId = resolveDocumentId(pathPart);

    if (!docId) {
        return null;
    }

    const href = `#docs?id=${encodeURIComponent(docId)}`;

    return hash
        ? `${href}&section=${encodeURIComponent(hash)}`
        : href;
}

function rewriteLocalReferences(container) {
    for (const anchor of container.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href') || '';

        if (href.startsWith('#docs?id=')) {
            continue;
        }

        if (
            isDocumentReference(href) &&
            !isExternalReference(href)
        ) {
            const spaHref = toSpaDocumentHref(href);

            if (spaHref) {
                anchor.setAttribute('href', spaHref);
                continue;
            }
        }

        if (
            href.startsWith('/') ||
            isExternalReference(href) ||
            href.startsWith('#')
        ) {
            continue;
        }

        try {
            const resolved = new URL(
                href,
                DOCS_ROOT
            );

            anchor.setAttribute(
                'href',
                resolved.href
            );
        } catch {
            // Leave malformed references untouched.
        }
    }

    for (const image of container.querySelectorAll('img[src]')) {
        const src = image.getAttribute('src') || '';

        if (
            src.startsWith('/') ||
            isExternalReference(src) ||
            src.startsWith('data:')
        ) {
            continue;
        }

        try {
            const resolved = new URL(
                src,
                DOCS_ROOT
            );

            image.setAttribute(
                'src',
                resolved.href
            );
        } catch {
            // Leave malformed sources untouched.
        }
    }

    for (const anchor of container.querySelectorAll('a[target]')) {
        if (anchor.getAttribute('target') === '_blank') {
            anchor.setAttribute(
                'rel',
                'noopener noreferrer'
            );
        }
    }
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
                'form'
            ],

            FORBID_ATTR: [
                'onerror',
                'onload',
                'onclick',
                'onmouseover',
                'onfocus',
                'onblur'
            ]
        }
    );
}

export function validateDocId(value) {
    return (
        typeof value === 'string' &&
        ALLOWED_DOC_ID.test(value)
    );
}

export function getDocumentUrl(docId) {
    if (!validateDocId(docId)) {
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
    const response = await fetch(
        getDocumentUrl(docId),
        {
            signal,

            headers: {
                Accept:
                    'text/markdown, text/plain;q=0.9, */*;q=0.8'
            }
        }
    );

    if (!response.ok) {
        const error = new Error(
            `Documentation request failed: ${response.status}`
        );

        error.status = response.status;

        throw error;
    }

    return response.text();
}

export function renderMarkdown(rawMarkdown) {
    assertMarkdownRuntime();

    const source = stripFrontMatter(
        String(rawMarkdown ?? '')
    );

    const html = window.marked.parse(
        source,
        {
            gfm: true,
            breaks: false,
            pedantic: false,
            async: false
        }
    );

    const safeHtml = sanitizeMarkdownHtml(
        html
    );

    const template =
        document.createElement('template');

    template.innerHTML = safeHtml;

    rewriteLocalReferences(
        template.content
    );

    return template.innerHTML;
}