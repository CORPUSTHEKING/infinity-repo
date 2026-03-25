export function renderDevicesPage(devices = []) {
  return `
    <section class="inf-page">
      <h2>Devices</h2>
      <div class="inf-grid">
        ${devices.map((device) => `
          <article class="inf-tile">
            <strong>${device.name || device.label || ''}</strong>
            <p>${device.note || device.description || ''}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
