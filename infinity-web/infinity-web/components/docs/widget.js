// Fetches the isolated docs manifest
export async function fetchDocs() {
    try {
        const res = await fetch('./assets/payloads/docs-manifest.json');
        return await res.json();
    } catch (e) {
        return [];
    }
}

// Generates the HTML snippet
export function renderDocsWidget(docs) {
    if (!docs.length) return '';
    const items = docs.map(d => `
        <a href="${d.link}" class="inf-doc-link" style="display:block; padding: 10px 0; margin-bottom: 8px; text-decoration: none; color: inherit;">
            <strong style="color: var(--primary);">${d.title}</strong>
            <p style="font-size: 0.85em; opacity: 0.8; margin: 4px 0 0 0;">${d.preview}</p>
        </a>
    `).join('');

    return `
        <div class="inf-docs-socket" style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;">Documentation & Guides</h3>
            <div class="inf-docs-grid">${items}</div>
        </div>
    `;
}
