let cachedManifest = null;

export async function getManifest() {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch('./assets/payloads/manifest.json');
    if (!res.ok) throw new Error('Manifest not found');
    cachedManifest = await res.json();
    return cachedManifest;
  } catch (err) {
    console.error('Failed to load script manifest:', err);
    return []; // Return empty tree on failure
  }
}

export async function searchScripts(query) {
  const manifest = await getManifest();
  const results = [];
  const q = query.toLowerCase();

  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'file' && node.name.toLowerCase().includes(q)) {
        results.push(node);
      } else if (node.type === 'directory' && node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(manifest);
  return results;
}
