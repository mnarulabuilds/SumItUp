const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const { AppError } = require("../../../src/lib/errors/AppError");
const errorHandler = require("../../../src/middleware/errorHandler").default
  || require("../../../src/middleware/errorHandler");

describe("errorHandler middleware", () => {
  afterEach(() => {
    sinon.restore();
    delete process.env.NODE_ENV;
  });

  it("returns AppError status and message", () => {
    const res = {
      headersSent: false,
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
    const next = sinon.spy();

    errorHandler(new AppError("Not found", 404), {}, res, next);
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ error: "Not found" })).to.be.true;
  });

  it("hides internal details in production", () => {
    process.env.NODE_ENV = "production";
    const res = {
      headersSent: false,
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    errorHandler(new Error("secret db failure"), {}, res, sinon.spy());
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ error: "Internal Server Error" })).to.be.true;
  });

  it("delegates to next when headers already sent", () => {
    const err = new Error("late");
    const next = sinon.spy();
    errorHandler(err, {}, { headersSent: true }, next);
    expect(next.calledOnceWith(err)).to.be.true;
  });
});
