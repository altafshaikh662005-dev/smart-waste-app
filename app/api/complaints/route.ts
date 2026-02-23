import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import { connectDB } from "@/lib/db";
import { analyzeComplaintWithAI } from "@/lib/ai";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { parseNumber } from "@/lib/validators";
import { Complaint } from "@/models/Complaint";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const query = all && payload.role === "admin" ? {} : { userId: payload.id };

    const complaints = await Complaint.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ complaints }, { status: 200 });
  } catch (error) {
    console.error("Get complaints error", error);
    return NextResponse.json({ error: "Failed to fetch complaints." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();

    const description = (formData.get("description") as string) || "";
    const wasteType = (formData.get("wasteType") as string) || "Mixed";
    const lat = parseNumber(formData.get("latitude"), null);
    const lng = parseNumber(formData.get("longitude"), null);

    if (!description || lat === null || lng === null) {
      return NextResponse.json(
        { error: "Description and valid location are required." },
        { status: 400 }
      );
    }

    let savedImagePath: string | undefined;
    const imageFile = formData.get("image");

    if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const fileName = `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      savedImagePath = `/uploads/${fileName}`;
    }

    const aiResult = await analyzeComplaintWithAI(description, wasteType);

    const complaint = await Complaint.create({
      userId: payload.id,
      image: savedImagePath,
      wasteType: aiResult.wasteType || wasteType,
      description,
      latitude: lat,
      longitude: lng,
      priority: aiResult.priority,
      status: "pending",
      aiTips: aiResult.tips
    });

    await User.findByIdAndUpdate(payload.id, {
      $push: { complaintIds: complaint._id }
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Create complaint error", error);
    return NextResponse.json({ error: "Failed to create complaint." }, { status: 500 });
  }
}

