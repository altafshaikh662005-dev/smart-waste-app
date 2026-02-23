import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { Complaint } from "@/models/Complaint";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = params;
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || typeof imageFile !== "object" || !("arrayBuffer" in imageFile)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    await connectDB();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `admin-${id}-${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const savedImagePath = `/uploads/${fileName}`;

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { adminImage: savedImagePath },
      { new: true }
    );

    return NextResponse.json({ complaint: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin image upload error", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
