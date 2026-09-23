const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const nodemailer = require("nodemailer");

describe("AuthService", () => {
  let authService;
  let sendMail;

  beforeEach(() => {
    sendMail = sinon.stub();
    sinon.stub(nodemailer, "createTransport").returns({ sendMail });
    delete require.cache[require.resolve("../../../src/services/auth")];
    delete require.cache[require.resolve("../../../src/services/auth/index.ts")];
    authService = require("../../../src/services/auth").default
      || require("../../../src/services/auth");
    process.env.CLIENT_URL = "http://localhost:8080";
    process.env.EMAIL_USER = "test@example.com";
  });

  afterEach(() => {
    sinon.restore();
  });

  it("sendResetEmail sends mail with reset link", async () => {
    sendMail.resolves({});
    await authService.sendResetEmail("user@example.com", "token-123");
    expect(sendMail.calledOnce).to.be.true;
    expect(sendMail.firstCall.args[0].to).to.equal("user@example.com");
    expect(sendMail.firstCall.args[0].html).to.include("token-123");
  });

  it("sendVerificationEmail sends mail with verification link", async () => {
    sendMail.resolves({});
    await authService.sendVerificationEmail("user@example.com", "verify-456");
    expect(sendMail.calledOnce).to.be.true;
    expect(sendMail.firstCall.args[0].html).to.include("verify-456");
  });

  it("sendEmail forwards generic options", async () => {
    sendMail.resolves({});
    await authService.sendEmail({
      to: "a@b.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });
    expect(sendMail.calledOnce).to.be.true;
    expect(sendMail.firstCall.args[0].subject).to.equal("Hello");
  });

  it("wraps transporter failures", async () => {
    sendMail.rejects(new Error("smtp down"));
    try {
      await authService.sendEmail({ to: "a@b.com", subject: "x", html: "y" });
      expect.fail("Expected throw");
    } catch (err) {
      expect(err.message).to.include("Error sending email");
    }
  });
});
