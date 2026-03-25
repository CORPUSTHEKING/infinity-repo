/**
 * Component: Card Actions
 * Fixed: Handles recursive paths and provides correct browser download URLs.
 */

export function bindCardActions(root, handlers = {}) {
  if (!root) return () => {};

  const onClick = (event) => {
    const expandButton = event.target.closest('[data-script-expand]');
    const actionButton = event.target.closest('[data-action]');
    const card = event.target.closest('[data-script-card]');

    if (!card) return;
    const itemId = card.getAttribute('data-script-id');

    if (expandButton) {
      handlers.onExpand?.(itemId, card);
      return;
    }

    if (actionButton) {
      const action = actionButton.getAttribute('data-action');
      handlers.onAction?.(action, itemId, card);
    }
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

export function handleDownload(itemNode, siteConfig) {
    if (!itemNode) return;

    const repoUrl = siteConfig?.repoUrl || 'https://github.com/CORPUSTHEKING/infinity';
    const branch = siteConfig?.branch || 'main';

    // The download URL must be relative to index.html
    const downloadUrl = `./assets/payloads/${itemNode.path}`;

    if (itemNode.type === 'file') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = itemNode.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`[Infinity] Triggered download: ${itemNode.path}`);
    } else if (itemNode.type === 'directory') {
        const githubFolderUrl = `${repoUrl}/tree/${branch}/infinity-web/assets/payloads/${itemNode.path}`;
        if (confirm(`Directory: "${itemNode.name}"\n\nBrowsers cannot download folders. Redirect to GitHub repo?`)) {
            window.open(githubFolderUrl, '_blank');
        }
    }
}
