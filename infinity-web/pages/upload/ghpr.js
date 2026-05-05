        const isUpload = hash === 'upload';
        const titleText = isUpload ? 'Upload a Script' : 'Request a Script';
        const labelText = isUpload ? 'Script Content or Link' : 'Describe the tool you need';
        const ghLabel = isUpload ? 'submission' : 'enhancement';

        ui.setPageContent(`
          <div class="inf-page">
            <h2>${titleText.toUpperCase()}</h2>
            <p class="inf-category-desc">
              Infinity is a decentralized static platform. Submissions are securely routed through GitHub Issues.                                         </p>
            <form class="inf-form" onsubmit="
              event.preventDefault();
              const title = encodeURIComponent((document.getElementById('inf-f-title').value || '').trim());
              const body = encodeURIComponent((document.getElementById('inf-f-body').value || '').trim());
              const url = 'https://github.com/CORPUSTHEKING/infinity/issues/new?title=' + title + '&body=' + body + '&labels=${ghLabel}';                   window.open(url, '_blank');
            ">
              <div class="inf-form-group">
                <input type="text" id="inf-f-title" placeholder="${isUpload ? 'e.g., Network Scanner Script' : 'e.g., Need a script to automate backups'}" required />
              </div>
              <div class="inf-form-group">
                <textarea id="inf-f-body" placeholder="${labelText}" rows="6" required></textarea>                                                          </div>
              <button type="submit" class="inf-btn-primary">Submit via GitHub</button>
            </form>
          </div>
        `);
       
