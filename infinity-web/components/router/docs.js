export async function handleDocsPageRoute(ui, urlParams) {
    const docId = urlParams.get('id');
    
    if (!docId) {
        ui.setPageContent(`
            <div class="inf-page">
                <h2>Documentation Error</h2>
                <p>No document ID specified.</p>
                <a href="#home" class="inf-btn-primary">Return Home</a>
            </div>
        `);
        return;
    }

    ui.setPageContent('<div class="inf-page"><p class="inf-loading">Loading documentation...</p></div>');

    try {
        const response = await fetch(`./assets/docs/${docId}.md`);
        if (!response.ok) throw new Error('Document not found');
        
        const rawMarkdown = await response.text();
        
        // Ensure marked is available (loaded in index.html)
        const htmlContent = window.marked ? marked.parse(rawMarkdown) : `<pre>${rawMarkdown}</pre>`;

        ui.setPageContent(`
            <div class="inf-page inf-doc-viewer">
                <div class="inf-doc-header">
                    <a href="#home" style="color: var(--primary); text-decoration: none; font-size: 0.8rem;">← BACK</a>
                </div>
                <article class="markdown-body">
                    ${htmlContent}
                </article>
            </div>
        `);
    } catch (err) {
        ui.setPageContent(`
            <div class="inf-page">
                <h2>404</h2>
                <p>Documentation for "${docId}" could not be found.</p>
                <a href="#home" class="inf-btn-primary">Back to Home</a>
            </div>
        `);
    }
}
