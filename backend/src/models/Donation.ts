import mongoose, { Document, Schema } from "mongoose";

export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  amountCents: number;
  currency: string;
  message?: string;
  status: "completed" | "failed";
}

const donationSchema = new Schema<IDonation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountCents: { type: Number, required: true, min: 100 },
    currency: { type: String, default: "USD" },
    message: { type: String, maxlength: 500 },
    status: { type: String, enum: ["completed", "failed"], default: "completed" },
  },
  { timestamps: true }
);

export default mongoose.model<IDonation>("Donation", donationSchema);
