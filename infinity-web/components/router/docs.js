import {
    fetchMarkdownDocument,
    renderMarkdown,
    validateDocId
} from '../../assets/js/docs/renderer.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function documentTitle(docId) {
    return String(docId)
        .replace(/[-_]+/g, ' ')
        .replace(
            /\b\w/g,
            (char) => char.toUpperCase()
        );
}

function getSection(urlParams) {
    const section =
        urlParams.get('section');

    if (
        !section ||
        !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(
            section
        )
    ) {
        return '';
    }

    return section;
}

async function scrollToSection(section) {
    if (!section) {
        return;
    }

    await new Promise((resolve) => {
        window.requestAnimationFrame(
            () => resolve()
        );
    });

    const target =
        document.getElementById(section);

    if (!target) {
        return;
    }

    target.scrollIntoView({
        block: 'start',
        behavior: 'smooth'
    });
}

export async function handleDocsPageRoute(
    ui,
    urlParams
) {
    const docId =
        urlParams.get('id');

    if (!validateDocId(docId)) {
        ui.setPageContent(`
            <div class="inf-page">
                <h2>Documentation Error</h2>
                <p>A valid document ID was not specified.</p>
                <a href="#home" class="inf-btn-primary">
                    Return Home
                </a>
            </div>
        `);

        return;
    }

    ui.setPageContent(`
        <div class="inf-page">
            <p class="inf-loading">
                Loading documentation...
            </p>
        </div>
    `);

    try {
        const rawMarkdown =
            await fetchMarkdownDocument(
                docId
            );

        const htmlContent =
            renderMarkdown(
                rawMarkdown
            );

        const title =
            documentTitle(docId);

        const section =
            getSection(urlParams);

        ui.setPageContent(`
            <div
                class="inf-page inf-doc-viewer"
                data-doc-id="${escapeHtml(docId)}"
            >
                <div class="inf-doc-header">
                    <a
                        href="#home"
                        class="inf-doc-back"
                        aria-label="Back to home"
                    >
                        ← BACK
                    </a>

                    <h2 class="inf-doc-title">
                        ${escapeHtml(title)}
                    </h2>
                </div>

                <article
                    class="markdown-body"
                    aria-label="${escapeHtml(title)} documentation"
                >
                    ${htmlContent}
                </article>
            </div>
        `);

        await scrollToSection(
            section
        );
    } catch (err) {
        const status =
            Number(err?.status) || 0;

        const isNotFound =
            status === 404;

        console.error(
            '[Infinity] Documentation rendering failed:',
            err
        );

        ui.setPageContent(`
            <div class="inf-page">
                <h2>
                    ${isNotFound
                        ? '404'
                        : 'Documentation Error'}
                </h2>

                <p>
                    ${isNotFound
                        ? `Documentation for "${escapeHtml(docId)}" could not be found.`
                        : `Documentation for "${escapeHtml(docId)}" could not be rendered.`}
                </p>

                <a
                    href="#home"
                    class="inf-btn-primary"
                >
                    ${isNotFound
                        ? 'Back to Home'
                        : 'Return Home'}
                </a>
            </div>
        `);
    }
}
