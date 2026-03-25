export function renderSummary({
  live = 0,
  total = 0,
  platforms = 0,
  devices = 0
} = {}) {
  return `
    <div class="inf-summary-grid">
      <article class="inf-summary-card">
        <strong>${live}</strong>
        <span>live scripts</span>
      </article>
      <article class="inf-summary-card">
        <strong>${total}</strong>
        <span>total scripts</span>
      </article>
      <article class="inf-summary-card">
        <strong>${platforms}</strong>
        <span>platform links</span>
      </article>
      <article class="inf-summary-card">
        <strong>${devices}</strong>
        <span>devices</span>
      </article>
    </div>
  `;
}
