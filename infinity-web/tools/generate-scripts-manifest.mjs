import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Scripts] Manifest ready: ${result.scripts.length} scripts; ` +
  `${result.meta.documentedScriptCount} documented.`
);
