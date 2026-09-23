const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const axios = require("axios");
const urlContentService = require("../../../src/services/summary/UrlContentService").default
  || require("../../../src/services/summary/UrlContentService");
const safeUrl = require("../../../src/utils/security/safeUrl");

describe("UrlContentService", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("rejects invalid URL format", async () => {
    try {
      await urlContentService.extractMainText("not-a-url");
      expect.fail("Expected extractMainText to throw");
    } catch (err) {
      expect(err.message).to.equal("Invalid URL format");
    }
  });

  it("extracts paragraph text from HTML", async () => {
    sinon.stub(safeUrl, "assertSafePublicUrl").resolves(new URL("https://example.com/article"));
    const longParagraph = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(8);
    sinon.stub(axios, "get").resolves({
      data: `<html><body><p>${longParagraph}</p></body></html>`,
    });

    const text = await urlContentService.extractMainText("https://example.com/article");
    expect(text).to.include("Lorem ipsum");
    expect(text.length).to.be.at.least(100);
  });

  it("falls back to body text when paragraphs are sparse", async () => {
    sinon.stub(safeUrl, "assertSafePublicUrl").resolves(new URL("https://example.com/page"));
    const bodyText = "Word ".repeat(80);
    sinon.stub(axios, "get").resolves({
      data: `<html><body>${bodyText}</body></html>`,
    });

    const text = await urlContentService.extractMainText("https://example.com/page");
    expect(text.length).to.be.at.least(100);
  });

  it("rejects pages with insufficient text", async () => {
    sinon.stub(safeUrl, "assertSafePublicUrl").resolves(new URL("https://example.com/empty"));
    sinon.stub(axios, "get").resolves({
      data: "<html><body>Hi</body></html>",
    });

    try {
      await urlContentService.extractMainText("https://example.com/empty");
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.include("insufficient text");
    }
  });
});
