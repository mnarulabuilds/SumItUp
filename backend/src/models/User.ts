import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  tokens: number;
  walletBalanceCents: number;
  subscriptionPlan: "free" | "plus" | "pro";
  subscriptionExpiresAt?: Date;
  adEligible: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  verificationToken?: string;
  verified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateResetToken(): string;
  validateResetToken(token: string): boolean;
  generateVerificationToken(): string;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"],
  },
  tokens: { type: Number, default: 0 },
  walletBalanceCents: { type: Number, default: 0, min: 0 },
  subscriptionPlan: {
    type: String,
    enum: ["free", "plus", "pro"],
    default: "free",
  },
  subscriptionExpiresAt: { type: Date },
  adEligible: { type: Boolean, default: true },
  resetToken: { type: String }, // For password reset functionality
  resetTokenExpiry: { type: Date }, // Expiry of the reset token
  verificationToken: { type: String }, // For email verification
  verified: { type: Boolean, default: false }, // is email verified
});

// Hash the password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate a reset token and set expiry date
userSchema.methods.generateResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetToken = resetToken;
  this.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
  return resetToken;
};

// Validate reset token
userSchema.methods.validateResetToken = function (token: string): boolean {
  const isTokenValid =
    this.resetToken === token && this.resetTokenExpiry && this.resetTokenExpiry > new Date();
  return !!isTokenValid;
};

// Generate Email verification token
userSchema.methods.generateVerificationToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: { $eq: email } });
};

export default mongoose.model<IUser, IUserModel>("User", userSchema);
