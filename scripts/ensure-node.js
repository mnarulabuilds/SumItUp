const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nvmrcPath = path.join(root, ".nvmrc");

if (!fs.existsSync(nvmrcPath)) {
  process.exit(0);
}

const expectedMajor = fs.readFileSync(nvmrcPath, "utf8").trim().split(".")[0];
const currentMajor = process.version.replace(/^v/, "").split(".")[0];

if (expectedMajor !== currentMajor) {
  console.error(
    `\n[ensure-node] Node ${expectedMajor}.x required (see .nvmrc). Current: ${process.version}.\n` +
      `Run: nvm use\n`
  );
  process.exit(1);
}
