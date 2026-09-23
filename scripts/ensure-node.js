const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkgPath = path.join(root, "package.json");
const nvmrcPath = path.join(root, ".nvmrc");

function parseNodeEngineRange(spec) {
  if (!spec || typeof spec !== "string") {
    return null;
  }
  const minMatch = spec.match(/>=?\s*(\d+)/);
  const maxMatch = spec.match(/<\s*(\d+)/);
  if (!minMatch) {
    return null;
  }
  return {
    minMajor: Number.parseInt(minMatch[1], 10),
    maxExclusiveMajor: maxMatch ? Number.parseInt(maxMatch[1], 10) : Number.POSITIVE_INFINITY,
  };
}

function currentMajor() {
  return Number.parseInt(process.version.replace(/^v/, "").split(".")[0], 10);
}

let enginesSpec = ">=20 <27";
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.engines?.node) {
    enginesSpec = pkg.engines.node;
  }
}

const range = parseNodeEngineRange(enginesSpec);
const major = currentMajor();

if (range && (major < range.minMajor || major >= range.maxExclusiveMajor)) {
  console.error(
    `\n[ensure-node] Node ${enginesSpec} required (see package.json engines). Current: ${process.version}.\n` +
      (fs.existsSync(nvmrcPath) ? `Recommended: nvm use (see .nvmrc)\n` : "")
  );
  process.exit(1);
}

if (fs.existsSync(nvmrcPath)) {
  const recommendedMajor = fs.readFileSync(nvmrcPath, "utf8").trim().split(".")[0];
  if (recommendedMajor && recommendedMajor !== String(major)) {
    console.warn(
      `[ensure-node] Tip: this repo is tested on Node ${recommendedMajor}.x (.nvmrc). Current: ${process.version}.`
    );
  }
}
