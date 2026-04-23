import { renderForm } from '../components/forms.js';

export function renderIwlPage(schema = {}) {
  return `
    <section class="inf-page">
      <h2>I Would Like</h2>
      ${renderForm(schema, {})}
    </section>
  `;
}
