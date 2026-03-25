import { renderForm } from '../components/forms.js';

export function renderReportPage(schema = {}) {
  return `
    <section class="inf-page">
      <h2>Report</h2>
      ${renderForm(schema, {})}
    </section>
  `;
}
