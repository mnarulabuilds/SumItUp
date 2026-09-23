/**
 * Copies legacy CommonJS modules into dist/ so `node dist/index.js` can resolve them.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const copies = [
  ["src/utils/audio", "dist/src/utils/audio"],
  ["src/utils/image", "dist/src/utils/image"],
  ["src/utils/text", "dist/src/utils/text"],
  ["src/services/summary/image.js", "dist/src/services/summary/image.js"],
  ["src/services/pdf/generate.js", "dist/src/services/pdf/generate.js"],
];

for (const [fromRel, toRel] of copies) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`[sync-dist-js-assets] Skip missing: ${fromRel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[sync-dist-js-assets] Copied ${fromRel} -> ${toRel}`);
}
