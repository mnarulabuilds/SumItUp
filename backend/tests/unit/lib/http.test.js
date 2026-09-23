const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const { AppError } = require("../../../src/lib/errors/AppError");
const handleControllerError = require("../../../src/lib/http/handleControllerError").default
  || require("../../../src/lib/http/handleControllerError");
const asyncHandler = require("../../../src/lib/http/asyncHandler").default
  || require("../../../src/lib/http/asyncHandler");

describe("AppError", () => {
  it("stores status code and operational flag", () => {
    const err = new AppError("Bad request", 400);
    expect(err.message).to.equal("Bad request");
    expect(err.statusCode).to.equal(400);
    expect(err.isOperational).to.be.true;
  });
});

describe("handleControllerError", () => {
  it("maps AppError to response status", () => {
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    handleControllerError(res, new AppError("Nope", 418), "fallback");
    expect(res.status.calledWith(418)).to.be.true;
    expect(res.json.calledWith({ error: "Nope" })).to.be.true;
  });

  it("uses fallback message for unknown errors", () => {
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    handleControllerError(res, new Error("boom"), "Server broke");
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ error: "Server broke" })).to.be.true;
  });
});

describe("asyncHandler", () => {
  it("forwards rejected promises to next", (done) => {
    const err = new Error("async fail");
    const req = {};
    const res = {};
    const next = (passedErr) => {
      try {
        expect(passedErr).to.equal(err);
        done();
      } catch (e) {
        done(e);
      }
    };
    const handler = asyncHandler(async () => {
      throw err;
    });

    handler(req, res, next);
  });
});
