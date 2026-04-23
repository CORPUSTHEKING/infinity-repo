export function renderSponsorPage() {
  return `
    <section class="inf-page">
      <h2>Sponsor Infinity</h2>
      <p>Support the maintenance, updates, and priority improvements for this open-source tool suite.</p>

      <div class="inf-grid">
        <article class="inf-tile">
          <strong>Supporter</strong>
          <p>Logo/name listed on the sponsor page.</p>
        </article>
        <article class="inf-tile">
          <strong>Maintainer</strong>
          <p>Priority acknowledgment and featured thanks.</p>
        </article>
        <article class="inf-tile">
          <strong>Gold</strong>
          <p>Logo placement plus highlighted sponsor visibility.</p>
        </article>
      </div>

      <div class="inf-actions">
        <a class="inf-button primary" href="https://github.com/sponsors/CORPUSTHEKING">Become a sponsor</a>
        <a class="inf-button secondary" href="mailto:corpustheking@gmail.com?subject=Infinity%20Sponsorship">Discuss a custom sponsor tier</a>
      </div>

      <p>Funding goes toward bug fixes, documentation, feature requests, and ongoing maintenance.</p>
    </section>
  `;
}
