import { fetchDocs, renderDocsWidget } from './widget.js';

// An observer that watches the DOM for the home/assistance page rendering
// It injects the docs dynamically, acting as a virtual socket.
const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            const page = document.querySelector('.inf-page');
            const h2 = page?.querySelector('h2');
            
            // Check if we are on the Home/Assistance screen and haven't injected yet
            if (h2 && h2.textContent.includes('Welcome to Infinity') && !document.querySelector('.inf-docs-socket')) {
                const docs = await fetchDocs();
                const widgetHtml = renderDocsWidget(docs);
                page.insertAdjacentHTML('afterend', widgetHtml);
            }
        }
    }
});

// Start watching the root app container
const root = document.getElementById('app');
if (root) {
    observer.observe(root, { childList: true, subtree: true });
}
