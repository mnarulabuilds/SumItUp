const fs = require("fs");
const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const summaryController = require("../../../src/controllers/summary");
const imageService = require("../../../src/services/summary/image");
const audioUtils = require("../../../src/utils/audio");
const textUtils = require("../../../src/utils/text");

describe("Summary Controller - Audio Content", () => {
  describe("generateAudioSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    afterEach(() => {
      fs.existsSync.restore();
    });

    it("should return error if invalid audio data provided", async () => {
      sinon.stub(fs, "existsSync").returns(true);
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Invalid audio data provided." })).to
        .be.true;
    });

    it("should return error if audio file not found", async () => {
      req.body.audioData = {
        audioFileName: "invalid/path/to/audio.mp3",
        format: "mp3",
      };
      sinon.stub(fs, "existsSync").returns(false);
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Audio file not found." })).to.be
        .true;
    });

    it("should return error if audio format not supported", async () => {
      req.body.audioData = {
        audioFileName: "valid/path/to/audio.mp3",
        format: "unsupported_format",
      };
      sinon.stub(fs, "existsSync").returns(true);
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Audio format not supported" })).to.be
        .true;
    });

    it("should return error if no text found in the audio", async () => {
      req.body.audioData = {
        audioFileName: "no-speech.mp3",
        format: "mp3",
      };
      sinon.stub(fs, "existsSync").returns(true);
      sinon.stub(audioUtils, "convertAudioToText").resolves(null);
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "No text found in the audio." })).to
        .be.true;
      audioUtils.convertAudioToText.restore(); // Restore stub after the test
    });

    it("should generate summary from text", async () => {
      req.body.audioData = {
        audioFileName: "valid/path/to/audio.mp3",
        format: "mp3",
      };
      sinon.stub(fs, "existsSync").returns(true);
      sinon
        .stub(audioUtils, "convertAudioToText")
        .resolves("This is a sample text.");
      sinon
        .stub(textUtils, "generateSummaryFromText")
        .returns("Generated summary");
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ summary: "Generated summary" })).to.be.true;
      audioUtils.convertAudioToText.restore();
      textUtils.generateSummaryFromText.restore();
    });

    it("should handle internal server error", async () => {
      req.body.audioData = {
        audioFileName: "valid/path/to/audio.mp3",
        format: "mp3",
      };
      sinon.stub(fs, "existsSync").returns(true);
      sinon
        .stub(audioUtils, "convertAudioToText")
        .rejects(new Error("Internal server error"));
      await summaryController.generateAudioSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: "Internal Server Error" })).to.be
        .true;
      audioUtils.convertAudioToText.restore();
    });
  });
});

describe("Summary Controller - Image Content", () => {
  describe("generateImageSummary", () => {
    it("should generate a summary from image data and return 200 status code", async () => {
      // Mock request and response objects
      const req = { body: { imageData: "mockImageData.jpg" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      sinon.stub(fs, "existsSync").returns(true);
      const mockSummary = "Generated summary";
      sinon
        .stub(imageService, "generateSummaryFromImage")
        .resolves(mockSummary);

      // Call the controller method
      await summaryController.generateImageSummary(req, res);

      // Verify the response
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ summary: mockSummary })).to.be.true;

      // Restore the stubs
      sinon.restore();
    });

    it("should handle errors and return 500 status code with error message", async () => {
      const req = { body: { imageData: "mockImageData.jpg" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      sinon.stub(fs, "existsSync").returns(true);
      sinon
        .stub(imageService, "generateSummaryFromImage")
        .throws(new Error("Failed to generate summary"));

      await summaryController.generateImageSummary(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("Failed to generate image summary");

      // Restore the stubs
      sinon.restore();
    });
  });
});

describe("Summary Controller - Video Content", () => {
  describe("generateVideoSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    it("should return error if video file is missing", async () => {
      await summaryController.generateVideoSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Video file is required" })).to.be.true;
    });

    it("should return summary for uploaded video file", async () => {
      req.body.videoData = { videoFileName: "clip.mp4" };
      sinon.stub(fs, "existsSync").returns(true);
      const speech = require("../../../src/services/transcription/SpeechToTextService").default
        || require("../../../src/services/transcription/SpeechToTextService");
      const textSummarizationService = require("../../../src/services/summary/TextSummarizationService").default
        || require("../../../src/services/summary/TextSummarizationService");
      sinon.stub(speech, "transcribeFile").resolves("Video transcript content.");
      sinon.stub(textSummarizationService, "summarizeCached").resolves("Video summary.");
      await summaryController.generateVideoSummary(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ summary: "Video summary.", transcriptLength: 25 })).to.be.true;
      sinon.restore();
    });

    it("should handle internal server error", async () => {
      // Simulate an error by passing invalid data that causes an exception
      req.body = null;
      await summaryController.generateVideoSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("Failed to process video");
    });
  });
});

describe("Summary Controller - GIF Content", () => {
  describe("generateGifSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    it("should return error if GIF URL is missing", async () => {
      await summaryController.generateGifSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "GIF filename is required" })).to.be.true;
    });

    it("should return summary for valid GIF file", async () => {
      req.body.imageData = "animation.gif";
      sinon.stub(fs, "existsSync").returns(true);
      sinon.stub(imageService, "generateSummaryFromImage").resolves("GIF visual summary.");
      await summaryController.generateGifSummary(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.firstCall.args[0].summary).to.equal("GIF visual summary.");
      sinon.restore();
    });

    it("should handle internal server error", async () => {
      req.body = null;
      await summaryController.generateGifSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("Failed to generate GIF summary");
    });
  });
});

describe("Summary Controller - URL Content", () => {
  describe("generateUrlSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    it("should return error if URL is missing", async () => {
      await summaryController.generateUrlSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "URL is required" })).to.be.true;
    });

    it("should return error for invalid URL format", async () => {
      req.body.url = "invalid-url";
      await summaryController.generateUrlSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Invalid URL format" })).to.be.true;
    });

    it("should return summary for valid URL when content is extracted", async () => {
      const urlContentService = require("../../../src/services/summary/UrlContentService").default
        || require("../../../src/services/summary/UrlContentService");
      const textSummarizationService = require("../../../src/services/summary/TextSummarizationService").default
        || require("../../../src/services/summary/TextSummarizationService");

      req.body.url = "https://example.com/article";
      sinon
        .stub(urlContentService, "extractMainText")
        .resolves("Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.");
      sinon
        .stub(textSummarizationService, "summarizeCached")
        .resolves("Concise URL summary.");

      await summaryController.generateUrlSummary(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ summary: "Concise URL summary." })).to.be.true;
      sinon.restore();
    });

    it("should handle internal server error", async () => {
      req.body = null;
      await summaryController.generateUrlSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0].error).to.include("Failed to process URL");
    });
  });
});

describe("Summary Controller - Book Content", () => {
  describe("generateBookSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    it("should return error for unsupported book format", async () => {
      req.body.bookData = { bookUrl: "notes.doc" };
      sinon.stub(fs, "existsSync").returns(true);
      await summaryController.generateBookSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("Unsupported book format");
      sinon.restore();
    });

    it("should generate a summary for Book content", async () => {
      req.body.bookData = { bookUrl: "sample-book.txt" };
      sinon.stub(fs, "existsSync").returns(true);
      sinon.stub(fs, "readFileSync").returns(
        "Chapter one content. ".repeat(20)
      );
      sinon.stub(textUtils, "generateSummaryFromText").returns(
        "Generated book summary for sample-book.txt"
      );

      await summaryController.generateBookSummary(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.getCall(0).args[0];
      expect(response.summary).to.include("Generated book summary");
      sinon.restore();
    });

    it("should handle internal server error", async () => {
      req.body = null;
      await summaryController.generateBookSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: "Internal Server Error" })).to.be.true;
    });
  });
});

describe("Summary Controller - PDF Content", () => {
  describe("generatePDFSummary", () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should return error if PDF data is missing", async () => {
      await summaryController.generatePDFSummary(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "PDF filename is required" })).to.be.true;
    });

    it("should return not found when PDF file is missing on disk", async () => {
      req.body.pdfData = { pdfUrl: "missing-file.pdf" };
      sinon.stub(fs, "existsSync").returns(false);

      await summaryController.generatePDFSummary(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: "PDF file not found" })).to.be.true;
    });

    it("should handle internal server error", async () => {
      req.body = null;
      await summaryController.generatePDFSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("PDF processing");
    });
  });
});
