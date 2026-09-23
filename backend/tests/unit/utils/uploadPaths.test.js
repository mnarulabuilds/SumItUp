const chai = require("chai");
const { expect } = chai;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { resolveUploadPath, assertUploadExists } = require("../../../src/utils/files/uploadPaths");
const { AppError } = require("../../../src/lib/errors/AppError");

describe("uploadPaths", () => {
  it("uses basename only to prevent traversal", () => {
    const resolved = resolveUploadPath("../../etc/passwd");
    expect(resolved.endsWith("passwd")).to.be.true;
    expect(resolved.includes("..")).to.be.false;
  });

  it("throws when filename is empty", () => {
    expect(() => resolveUploadPath("")).to.throw("File reference is required");
  });

  it("assertUploadExists throws AppError when missing", () => {
    const missing = path.join(os.tmpdir(), `missing-${Date.now()}.txt`);
    try {
      assertUploadExists(missing, "File not found");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
    }
  });

  it("assertUploadExists passes when file exists", () => {
    const file = path.join(os.tmpdir(), `exists-${Date.now()}.txt`);
    fs.writeFileSync(file, "ok");
    expect(() => assertUploadExists(file, "missing")).not.to.throw();
    fs.unlinkSync(file);
  });

  it("respects UPLOAD_PATH environment variable", () => {
    const customRoot = path.join(os.tmpdir(), `uploads-${Date.now()}`);
    fs.mkdirSync(customRoot, { recursive: true });
    const previous = process.env.UPLOAD_PATH;
    process.env.UPLOAD_PATH = customRoot;
    try {
      delete require.cache[require.resolve("../../../src/utils/files/uploadPaths")];
      const mod = require("../../../src/utils/files/uploadPaths");
      const resolved = mod.resolveUploadPath("sample.pdf");
      expect(resolved).to.equal(path.join(customRoot, "sample.pdf"));
    } finally {
      process.env.UPLOAD_PATH = previous;
      delete require.cache[require.resolve("../../../src/utils/files/uploadPaths")];
      fs.rmSync(customRoot, { recursive: true, force: true });
    }
  });
});
