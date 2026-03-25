import { renderForm } from '../components/forms.js';

export function renderRequestPage(schema = {}) {
  return `
    <section class="inf-page">
      <h2>Request</h2>
      ${renderForm(schema, {})}
    </section>
  `;
}
