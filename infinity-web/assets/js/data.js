import { loadConfig, getCachedConfig } from './config.js';

function getManifestTree(config) {
  const manifest = config?.data?.payloadManifest ?? config?.payloadManifest ?? [];
  return Array.isArray(manifest) ? manifest : [];
}

export async function getManifest() {
  const config = getCachedConfig() || await loadConfig();
  return getManifestTree(config);
}

export async function searchScripts(query = '') {
  const manifest = await getManifest();
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return [];

  const results = [];

  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;

      if (
        node.type === 'file' &&
        typeof node.name === 'string' &&
        node.name.toLowerCase().includes(q)
      ) {
        results.push(node);
        continue;
      }

      if (node.type === 'directory') traverse(node.children);
    }
  }

  traverse(manifest);
  return results;
}

export function clearDataCache() {
  // Configuration/data caching is centrally owned by config.js.
}
