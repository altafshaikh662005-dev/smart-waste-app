import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ComplaintStatus = "pending" | "in-progress" | "completed";
export type ComplaintPriority = "low" | "medium" | "high";

export interface IComplaint extends Document {
  userId: Types.ObjectId;
  image?: string;
  adminImage?: string;
  wasteType: string;
  description: string;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  aiTips?: string;
  completedAt?: Date;
  userNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String },
    adminImage: { type: String },
    wasteType: { type: String, required: true },
    description: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    aiTips: { type: String },
    completedAt: { type: Date },
    userNotifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const Complaint: Model<IComplaint> =
  (mongoose.models.Complaint as Model<IComplaint>) ||
  mongoose.model<IComplaint>("Complaint", ComplaintSchema);

