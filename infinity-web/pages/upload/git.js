/**
 * Renders the GitHub Portal iframe.
 */
export function renderGitPortal() {
    return `
    <div class="mt-4">
        <iframe 
            src="./pages/upload/github.html" 
            style="width: 100%; height: 600px; border: 1px solid #30363d; border-radius: 8px;"
            title="GitHub Submission Portal">
        </iframe>
    </div>
    `;
}
