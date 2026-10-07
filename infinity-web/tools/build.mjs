import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

console.log(
  '[Build] Starting Infinity Web build metadata generation...'
);

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Build] Complete: ${result.meta.scriptCount} scripts, ` +
  `${result.meta.documentedScriptCount} documented, ` +
  `${result.meta.documentationCount} documentation entries.`
);
