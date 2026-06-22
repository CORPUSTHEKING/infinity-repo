import { renderScriptCards } from './cards.js';

export function renderCategoriesView(tree = [], { query = '' } = {}) {
    return `
    <div class="wrap">
        ${tree.map(node => {
            if (node.type !== 'directory') return '';
            const files = node.children.filter(c => c.type === 'file');
            
            return `
            <section>
                <div class="section-head">
                    <div>
                        <h2>${node.name.toUpperCase()}</h2>
                        <p></p>
                    </div>
                    <div class="pill-row">
                        <span class="pill">${files.length} SCRIPTS LOADED</span>
                    </div>
                </div>
                
                <div class="grid">
                    ${renderScriptCards(files)}
                </div>
            </section>
            `;
        }).join('')}
    </div>`;
}

export function renderSearchResultsView(results = [], query = '') {
    return `
    <div class="wrap">
        <section>
            <div class="section-head">
                <div>
                    <h2>Search Results</h2>
                    <p>Matching scripts for your search query.</p>
                </div>
                <div class="pill-row">
                    <span class="pill">${results.length} MATCHES</span>
                </div>
            </div>
            
            ${results.length > 0 ? `
                <div class="grid">
                    ${renderScriptCards(results)}
                </div>
            ` : `
                <div class="empty">
                    No Script Templates match your search query.
                </div>
            `}
        </section>
    </div>`;
}
