/**
 * Sample data seed script.
 * Run: npm run seed
 * Requires MONGODB_URI in .env
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    points: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const ComplaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    image: String,
    wasteType: String,
    description: String,
    latitude: Number,
    longitude: Number,
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    aiTips: String
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: "smart-waste" });

  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedUser = await bcrypt.hash("user123", 10);

  const admin = await User.findOneAndUpdate(
    { email: "admin@smartwaste.local" },
    {
      name: "Admin",
      email: "admin@smartwaste.local",
      password: hashedAdmin,
      role: "admin",
      points: 0
    },
    { upsert: true, new: true }
  );

  const user = await User.findOneAndUpdate(
    { email: "user@smartwaste.local" },
    {
      name: "Test User",
      email: "user@smartwaste.local",
      password: hashedUser,
      role: "user",
      points: 10
    },
    { upsert: true, new: true }
  );

  const samples = [
    {
      userId: user._id,
      wasteType: "Plastic",
      description: "Overflowing bin near the park entrance.",
      latitude: 19.076,
      longitude: 72.8777,
      status: "pending",
      priority: "medium"
    },
    {
      userId: user._id,
      wasteType: "Organic",
      description: "Food waste dumped on sidewalk.",
      latitude: 19.078,
      longitude: 72.879,
      status: "in-progress",
      priority: "high"
    },
    {
      userId: user._id,
      wasteType: "Mixed",
      description: "Illegal dumping near the river.",
      latitude: 19.074,
      longitude: 72.875,
      status: "completed",
      priority: "high"
    }
  ];

  for (const s of samples) {
    await Complaint.findOneAndUpdate(
      { description: s.description },
      s,
      { upsert: true, new: true }
    );
  }

  console.log("Seed done.");
  console.log("Admin: admin@smartwaste.local / admin123");
  console.log("User:  user@smartwaste.local / user123");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
