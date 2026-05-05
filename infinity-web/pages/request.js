import { renderForm } from '../components/forms.js';

export function renderRequestPage(schema = {}) {
  return `
    <section class="inf-page">
      <h2>Request</h2>
      ${renderForm(schema, {})}
    </section>
  `;
}

export function bindRequestEvents() {
  // Assuming your renderForm generates a form with this ID
  const form = document.querySelector('form'); 
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Extracted from your old router logic
    const titleInputs = document.querySelectorAll('input[type="text"]');
    const descInputs = document.querySelectorAll('textarea');
    
    const title = encodeURIComponent((titleInputs[0]?.value || '').trim());
    const body = encodeURIComponent((descInputs[0]?.value || '').trim());
    
    const url = 'https://github.com/CORPUSTHEKING/infinity/issues/new?title=' + title + '&body=' + body + '&labels=enhancement';
    window.open(url, '_blank');
  });
}
