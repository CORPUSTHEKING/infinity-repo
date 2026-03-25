import { renderScriptCards } from '../components/cards.js';

export function renderDownloadPage(items = []) {
  return `
    <section class="inf-page">
      <h2>Downloads</h2>
      <p>Immediate download actions for scripts and sections.</p>
      ${renderScriptCards(items)}
    </section>
  `;
}
