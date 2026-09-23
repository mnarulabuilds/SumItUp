const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const searchController = require("../../../src/controllers/search");
const contentSearchService = require("../../../src/services/search/ContentSearchService").default
  || require("../../../src/services/search/ContentSearchService");
const Content = require("../../../src/models/Content");

describe("Search Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "507f1f77bcf86cd799439011" },
      query: {},
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("fuzzySearch", () => {
    it("should return error if query is missing", async () => {
      await searchController.fuzzySearch(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Search query is required" })).to.be.true;
    });

    it("should return error if query is empty", async () => {
      req.query.query = "   ";
      await searchController.fuzzySearch(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Search query is required" })).to.be.true;
    });

    it("should perform fuzzy search with default parameters", async () => {
      req.query.query = "javascript";
      sinon.stub(contentSearchService, "searchUserContent").resolves([
        {
          id: "1",
          title: "JavaScript notes",
          type: "url",
          summary: "Summary",
          tags: [],
          relevanceScore: 1,
        },
      ]);

      await searchController.fuzzySearch(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.getCall(0).args[0];
      expect(response.query).to.equal("javascript");
      expect(response.results).to.be.an("array").with.length(1);
    });

    it("should return 401 without auth user", async () => {
      delete req.user;
      req.query.query = "test";
      await searchController.fuzzySearch(req, res);
      expect(res.status.calledWith(401)).to.be.true;
    });
  });

  describe("searchBooks", () => {
    it("should return error if no search parameters provided", async () => {
      await searchController.searchBooks(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it("should search saved book content", async () => {
      req.query.title = "JavaScript Guide";
      sinon.stub(Content, "find").returns({
        sort: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: "abc",
                title: "JavaScript Guide",
                summary: "Book summary",
                tags: ["Douglas Crockford", "Programming"],
              },
            ],
          }),
        }),
      });

      await searchController.searchBooks(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.getCall(0).args[0];
      expect(response.books).to.be.an("array").with.length(1);
    });
  });
});
