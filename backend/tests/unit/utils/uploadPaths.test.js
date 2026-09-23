const chai = require("chai");
const { expect } = chai;
const { resolveUploadPath } = require("../../../src/utils/files/uploadPaths");

describe("uploadPaths", () => {
  it("uses basename only to prevent traversal", () => {
    const resolved = resolveUploadPath("../../etc/passwd");
    expect(resolved.endsWith("passwd")).to.be.true;
    expect(resolved.includes("..")).to.be.false;
  });

  it("throws when filename is empty", () => {
    expect(() => resolveUploadPath("")).to.throw("File reference is required");
  });
});
