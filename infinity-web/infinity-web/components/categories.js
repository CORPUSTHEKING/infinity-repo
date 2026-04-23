import { renderScriptCards } from './cards.js';

export function renderCategoriesView(tree = [], { query = '' } = {}) {
    return `
    <div class="inf-categories">
        ${tree.map(node => {
            if (node.type !== 'directory') return '';
            const files = node.children.filter(c => c.type === 'file');
            return `
            <section class="inf-category">
                <div class="inf-category-head">
                    <h2>${node.name.toUpperCase()}</h2>
                    <span class="inf-badge">${files.length} SCRIPTS LOADED</span>
                </div>
                <p class="inf-category-desc">above pane describes this script category then the scripts roll -><- horizontally</p>
                <div class="inf-cards-rail">
                    ${renderScriptCards(files)}
                </div>
            </section>
            `;
        }).join('')}
    </div>`;
}

export function renderSearchResultsView(results = [], query = '') {
    return `
    <div class="inf-categories">
        <section class="inf-category">
            <div class="inf-category-head">
                <h2>SEARCH RESULTS</h2>
                <span class="inf-badge">${results.length} MATCHES</span>
            </div>
            <p class="inf-category-desc">Matching scripts for your search query.</p>
            <div class="inf-cards-rail">
                ${renderScriptCards(results)}
            </div>
        </section>
    </div>`;
}
