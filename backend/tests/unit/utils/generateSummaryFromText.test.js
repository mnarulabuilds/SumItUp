const chai = require("chai");
const { expect } = chai;
const generateSummaryFromText = require("../../../src/utils/text/generateSummaryFromText");

describe("generateSummaryFromText", () => {
  it("returns empty string for empty input", () => {
    expect(generateSummaryFromText("")).to.equal("");
    expect(generateSummaryFromText(null)).to.equal("");
  });

  it("returns original text when fewer than four sentences", () => {
    const short = "One sentence only.";
    expect(generateSummaryFromText(short)).to.equal(short);
  });

  it("returns a shorter summary for longer multi-sentence text", () => {
    const text = [
      "The product launch exceeded expectations across all regions.",
      "Revenue grew twenty percent year over year in the first quarter.",
      "Customer satisfaction scores reached an all-time high.",
      "The team attributed success to improved onboarding and support.",
      "Marketing campaigns focused on clarity and measurable outcomes.",
      "Engineering shipped critical performance fixes ahead of schedule.",
      "In conclusion, the company remains focused on sustainable growth.",
    ].join(" ");

    const summary = generateSummaryFromText(text);
    expect(summary.length).to.be.below(text.length);
    expect(summary.length).to.be.above(20);
  });
});
