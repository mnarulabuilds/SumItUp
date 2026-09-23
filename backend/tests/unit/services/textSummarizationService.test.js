const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const textSummarizationService = require("../../../src/services/summary/TextSummarizationService").default
  || require("../../../src/services/summary/TextSummarizationService");
const textUtils = require("../../../src/utils/text");
const cacheService = require("../../../src/cache").default || require("../../../src/cache");

describe("TextSummarizationService", () => {
  afterEach(() => {
    sinon.restore();
    cacheService.flushAll();
  });

  it("returns empty string for blank input", () => {
    expect(textSummarizationService.summarize("   ")).to.equal("");
  });

  it("delegates summarize to text utils", () => {
    sinon.stub(textUtils, "generateSummaryFromText").returns("Short summary.");
    expect(textSummarizationService.summarize("Long body text")).to.equal("Short summary.");
  });

  it("summarizeCached stores and reuses cached values", async () => {
    sinon.stub(textUtils, "generateSummaryFromText").returns("Cached summary.");
    const input = "Same input text for cache test.";

    const first = await textSummarizationService.summarizeCached(input);
    const second = await textSummarizationService.summarizeCached(input);

    expect(first).to.equal("Cached summary.");
    expect(second).to.equal("Cached summary.");
    expect(textUtils.generateSummaryFromText.calledOnce).to.be.true;
  });
});
