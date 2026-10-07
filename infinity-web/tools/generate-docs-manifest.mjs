import {
  generateUnifiedManifest
} from './generate-manifest.mjs';

const result =
  await generateUnifiedManifest({
    write: true
  });

console.log(
  `[Docs] Compatibility manifest ready: ${result.docs.length} documentation entries.`
);
