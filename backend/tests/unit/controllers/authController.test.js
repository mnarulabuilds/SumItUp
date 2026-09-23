const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const authController = require("../../../src/controllers/auth");
const User = require("../../../src/models/User");
const authService = require("../../../src/services/auth");

describe("Auth Controller", () => {
  describe("signup", () => {
    it("should create a new user", async () => {
      const req = {
        body: {
          username: "test",
          email: "test@example.com",
          password: "Password1!",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves(null);
      sinon
        .stub(User.prototype, "save")
        .resolves({ _id: "123456", email: "test@example.com" });

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;

      // Restore stubs
      User.findByEmail.restore();
      User.prototype.save.restore();
    });

    it("should return 400 if username is missing", async () => {
      const req = {
        body: { email: "test@example.com", password: "Password1!" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(
        res.json.calledWith({
          error: "Username, Email, and password are required",
        })
      ).to.be.true;
    });

    it("should return 400 if email is missing", async () => {
      const req = {
        body: { username: "Test", password: "Password1!" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(
        res.json.calledWith({
          error: "Username, Email, and password are required",
        })
      ).to.be.true;
    });

    it("should return 400 if password is missing", async () => {
      const req = {
        body: { username: "Test", email: "test@example.com" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(
        res.json.calledWith({
          error: "Username, Email, and password are required",
        })
      ).to.be.true;
    });

    it("should return 400 if email is invalid", async () => {
      const req = {
        body: {
          username: "Test",
          email: "invalid-email",
          password: "Password1!",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Invalid email format" })).to.be.true;
    });

    it("should return 400 if password is weak", async () => {
      const req = {
        body: {
          username: "Test",
          email: "test@example.com",
          password: "123456",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.include("Password must be at least 8 characters");
    });

    it("should return 409 if user already exists", async () => {
      const req = {
        body: {
          username: "User",
          email: "existing-user@example.com",
          password: "Password1!",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon
        .stub(User, "findByEmail")
        .resolves({ email: "existing-user@example.com" });

      await authController.signup(req, res);

      expect(res.status.calledOnceWith(409)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "User already exists" })).to.be.true;

      User.findByEmail.restore();
    });
  });

  describe("login", () => {
    it("should generate a JWT token for valid user", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "Password1!",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      const user = {
        _id: "123456",
        email: "test@example.com",
        password: "hashedPassword",
        comparePassword: sinon.stub().resolves(true),
      };

      sinon.stub(User, "findByEmail").resolves(user);
      sinon.stub(jwt, "sign").returns("token");

      await authController.login(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ token: "token" })).to.be.true;

      User.findByEmail.restore();
      jwt.sign.restore();
    });

    it("should return 400 if email is missing", async () => {
      const req = {
        body: { password: "Password1!" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.login(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Email and password are required" }))
        .to.be.true;
    });

    it("should return 400 if password is missing", async () => {
      const req = {
        body: { email: "test@example.com" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await authController.login(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Email and password are required" }))
        .to.be.true;
    });

    it("should return 401 if user is not found", async () => {
      const req = {
        body: { email: "nonexistent@example.com", password: "Password1!" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves(null);

      await authController.login(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "User not found" })).to.be.true;

      User.findByEmail.restore();
    });

    it("should return 401 if password is incorrect", async () => {
      const req = {
        body: { email: "test@example.com", password: "IncorrectPassword" },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      const user = {
        _id: "123456",
        email: "test@example.com",
        password: "hashedPassword",
        comparePassword: sinon.stub().resolves(false),
      };

      sinon.stub(User, "findByEmail").resolves(user);

      await authController.login(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Invalid credentials" })).to.be.true;

      User.findByEmail.restore();
    });
  });

  describe("forgotPassword", () => {
    it("should send a reset link if the user exists", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves({
        email: "test@example.com",
        save: sinon.stub().resolves(),
        generateResetToken: sinon.stub().returns("reset-token"),
      });
      sinon.stub(authService, "sendResetEmail").resolves();

      await authController.forgotPassword(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: "Password reset link sent" })).to.be
        .true;

      User.findByEmail.restore();
      authService.sendResetEmail.restore();
    });

    it("should return 404 if the user does not exist", async () => {
      const req = {
        body: {
          email: "nonexistent@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves(null);

      await authController.forgotPassword(req, res);

      expect(res.status.calledOnceWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "User not found" })).to.be.true;

      User.findByEmail.restore();
    });

    it("should return 500 if there's an error sending the reset email", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves({
        email: "test@example.com",
        save: sinon.stub().resolves(),
        generateResetToken: sinon.stub().returns("reset-token"),
      });
      sinon
        .stub(authService, "sendResetEmail")
        .rejects(new Error("Send email error"));

      await authController.forgotPassword(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Error sending reset link" })).to.be
        .true;

      User.findByEmail.restore();
      authService.sendResetEmail.restore();
    });
  });

  describe("resetPassword", () => {
    it("should reset the password if the token is valid", async () => {
      const req = {
        body: {
          token: "valid-token",
          newPassword: "NewPassword1",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findOne").resolves({
        resetToken: "valid-token",
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        password: "oldPassword",
        save: sinon.stub().resolves(),
      });

      await authController.resetPassword(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: "Password reset successfully" })).to
        .be.true;

      User.findOne.restore();
    });

    it("should return 400 if the token is invalid", async () => {
      const req = {
        body: {
          token: "invalid-token",
          newPassword: "NewPassword1",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findOne").resolves(null);

      await authController.resetPassword(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Invalid or expired reset token" }))
        .to.be.true;

      User.findOne.restore();
    });

    it("should return 400 if the password is weak", async () => {
      const req = {
        body: {
          token: "valid-token",
          newPassword: "short",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findOne").resolves({
        resetToken: "valid-token",
        resetTokenExpiry: Date.now() + 3600000, // 1 hour
      });

      await authController.resetPassword(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(
        res.json.calledWith({
          error: "Password must be alphanumeric and at least 8 characters long",
        })
      ).to.be.true;

      User.findOne.restore();
    });
  });

  describe("sendVerificationEmail", () => {
    it("should send a verification email if the user exists", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves({
        email: "test@example.com",
        verified: false,
        generateVerificationToken: sinon.stub().returns("verification-token"),
        save: sinon.stub().resolves(),
      });

      sinon.stub(authService, "sendVerificationEmail").resolves();

      await authController.sendVerificationEmail(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: "Verification email sent" })).to.be
        .true;

      User.findByEmail.restore();
      authService.sendVerificationEmail.restore();
    });

    it("should return 404 if the user does not exist", async () => {
      const req = {
        body: {
          email: "nonexistent@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves(null);

      await authController.sendVerificationEmail(req, res);

      expect(res.status.calledOnceWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "User not found" })).to.be.true;

      User.findByEmail.restore();
    });

    it("should return 500 if there's an error sending the verification email", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findByEmail").resolves({
        email: "test@example.com",
        generateVerificationToken: sinon.stub().returns("verification-token"),
      });
      sinon
        .stub(authService, "sendVerificationEmail")
        .rejects(new Error("Send email error"));

      await authController.sendVerificationEmail(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Error sending verification email" }))
        .to.be.true;

      User.findByEmail.restore();
      authService.sendVerificationEmail.restore();
    });
  });

  describe("verifyEmail", () => {
    it("should verify the email if the token is valid", async () => {
      const req = {
        query: {
          token: "valid-token",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findOne").resolves({
        verificationToken: "valid-token",
        verified: false,
        save: sinon.stub().resolves(),
      });

      await authController.verifyEmail(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: "Email verified successfully" })).to
        .be.true;

      User.findOne.restore();
    });

    it("should return 400 if the token is invalid", async () => {
      const req = {
        query: {
          token: "invalid-token",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findOne").resolves(null);

      await authController.verifyEmail(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.calledWith({ error: "Invalid verification token" })).to.be
        .true;

      User.findOne.restore();
    });
  });
});
