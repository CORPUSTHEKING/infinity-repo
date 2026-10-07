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
        raw
            .split('/')
            .filter(Boolean);

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

function defaultDocumentationHash(
    itemId
) {
    const rawId =
        String(itemId ?? '').trim();

    if (!rawId) {
        return null;
    }

    if (
        /^(?:javascript|data|vbscript):/i.test(
            rawId
        )
    ) {
        return null;
    }

    return `#docs?id=${encodeURIComponent(
        rawId
    )}`;
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

        if (
            typeof Element === 'undefined' ||
            !(target instanceof Element)
        ) {
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

                /*
                 * Preserve the existing contract:
                 * an explicit boolean result tells this
                 * component that the handler has decided
                 * what should happen.
                 */
                if (
                    result === true ||
                    result === false
                ) {
                    return;
                }
            }

            /*
             * Preserve data-doc-url support.
             * When it is not present, use the canonical
             * generated documentation route.
             */
            const target =
                docUrl ||
                defaultDocumentationHash(
                    itemId
                );

            if (target) {
                navigateToHash(
                    target
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
