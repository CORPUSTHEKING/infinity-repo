import { renderForm } from '../components/forms.js';

/**
 * Renders the Upload Page HTML.
 * @param {Object} schema - The form schema (fallback provided if missing).
 */
export function renderUploadPage(schema = {}) {
    // Default schema if none provided to ensure the form has required fields
    const defaultSchema = {
        fields: [
            { id: 'up-id', label: 'Script/Engine ID', type: 'text', placeholder: 'e.g., custom-engine-01', required: true },
            { id: 'up-author', label: 'Author', type: 'text', placeholder: 'Your handle' },
            { id: 'up-category', label: 'Target Category', type: 'select', options: ['Engines', 'Tools', 'Plugins', 'Other'] },
            { id: 'up-desc', label: 'Description', type: 'textarea', placeholder: 'What does this do?' },
            { id: 'up-code', label: 'Source Code / Content', type: 'textarea', placeholder: 'Paste code here...', required: true }
        ]
    };

    const finalSchema = Object.keys(schema).length ? schema : defaultSchema;

    return `
    <section class="inf-page container my-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card bg-dark text-white border-primary shadow-lg">
            <div class="card-header border-primary bg-transparent py-3">
              <h2 class="h4 mb-0 text-primary"><i class="fas fa-cloud-upload-alt me-2"></i>Infinity Submission Portal</h2>
            </div>
            <div class="card-body">
              ${renderForm(finalSchema, { id: 'upload-form' })}
            </div>
            <div class="card-footer border-top border-secondary small text-muted text-center">
              Logged-in users contribute via GitHub Issues. Guests contribute via secure email relay.
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
}

/**
 * Binds the logic for conditional routing (GitHub vs Email).
 * This should be called by the router or app.js after the DOM is rendered.
 * @param {Object} siteConfig - Configuration containing repoUrl and auth state.
 */
export function bindUploadEvents(siteConfig = {}) {
    const form = document.getElementById('upload-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Extract Data
        const formData = {
            id: document.getElementById('up-id')?.value.trim(),
            author: document.getElementById('up-author')?.value.trim() || 'Anonymous',
            category: document.getElementById('up-category')?.value || 'General',
            desc: document.getElementById('up-desc')?.value.trim() || 'No description provided.',
            code: document.getElementById('up-code')?.value.trim()
        };

        // 2. Format the Payload (Markdown)
        const payloadText = `### 🚀 New Script Submission: ${formData.id}
**Author:** ${formData.author}
**Category:** ${formData.category}

**Description:**
${formData.desc}

**Code:**
\`\`\`bash
${formData.code}
\`\`\`

---
*Submitted via Infinity Web Engine Interface*`;

        // 3. Determine Auth State
        const isAuthenticated = !!localStorage.getItem('infinity_token') || siteConfig.isLoggedIn || false;

        if (isAuthenticated) {
            // ROUTE A: Logged In -> GitHub Issues
            const repo = siteConfig.repoUrl || 'https://github.com/CORPUSTHEKING/infinity';
            const issueUrl = `${repo}/issues/new?title=${encodeURIComponent('New Script: ' + formData.id)}&labels=community-submission&body=${encodeURIComponent(payloadText)}`;
            
            console.log('Infinity: User authenticated. Routing to GitHub...');
            window.open(issueUrl, '_blank');
        } else {
            // ROUTE B: Guest -> Email
            const recipients = "corpustheking@gmail.com,mikewebah@gmail.com";
            const subject = `Infinity Script Submission: ${formData.id}`;
            const mailtoUrl = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payloadText)}`;
            
            console.log('Infinity: Guest user. Routing to developer emails...');
            window.location.href = mailtoUrl;
        }

        form.reset();
    });
}
