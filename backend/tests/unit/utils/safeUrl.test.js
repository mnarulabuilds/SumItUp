const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const dns = require("dns/promises");
const { assertSafePublicUrl } = require("../../../src/utils/security/safeUrl");

describe("assertSafePublicUrl", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("rejects malformed URLs", async () => {
    try {
      await assertSafePublicUrl("not-a-url");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.equal("Invalid URL format");
      expect(err.statusCode).to.equal(400);
    }
  });

  it("rejects non-http(s) protocols", async () => {
    try {
      await assertSafePublicUrl("ftp://example.com/file");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.equal("Only HTTP and HTTPS URLs are allowed");
    }
  });

  it("rejects blocked hostnames", async () => {
    try {
      await assertSafePublicUrl("http://localhost/path");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.equal("URL host is not allowed");
    }
  });

  it("rejects private IP literals", async () => {
    try {
      await assertSafePublicUrl("http://127.0.0.1/");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.equal("URL host is not allowed");
    }
  });

  it("allows public IP literals", async () => {
    const url = await assertSafePublicUrl("https://1.1.1.1/");
    expect(url.hostname).to.equal("1.1.1.1");
  });

  it("rejects hostnames that resolve to private IPs", async () => {
    sinon.stub(dns, "lookup").resolves([{ address: "10.0.0.5", family: 4 }]);
    try {
      await assertSafePublicUrl("https://evil.example.com/");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.equal("URL host is not allowed");
    }
  });

  it("allows hostnames that resolve to public IPs", async () => {
    sinon.stub(dns, "lookup").resolves([{ address: "93.184.216.34", family: 4 }]);
    const url = await assertSafePublicUrl("https://example.com/article");
    expect(url.hostname).to.equal("example.com");
  });
});
