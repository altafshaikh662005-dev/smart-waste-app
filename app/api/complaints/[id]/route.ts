import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { Complaint } from "@/models/Complaint";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const isOwner = complaint.userId?.toString() === payload.id;
    const isAdmin = payload.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    return NextResponse.json({ complaint }, { status: 200 });
  } catch (error) {
    console.error("Get complaint error", error);
    return NextResponse.json({ error: "Failed to fetch report." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const status = body?.status;

    if (!["pending", "in-progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const existing = await Complaint.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = { status };
    if (status === "completed") {
      update.completedAt = new Date();
      update.userNotifiedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      params.id,
      update,
      { new: true }
    );

    // Reward user points when complaint is marked completed (only if wasn't already)
    const wasCompleted = existing.status === "completed";
    if (status === "completed" && complaint?.userId && !wasCompleted) {
      await User.findByIdAndUpdate(complaint.userId, {
        $inc: { points: 10 }
      });
    }

    return NextResponse.json({ complaint }, { status: 200 });
  } catch (error) {
    console.error("Update complaint error", error);
    return NextResponse.json({ error: "Failed to update complaint." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();

    const complaint = await Complaint.findByIdAndDelete(params.id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete complaint error", error);
    return NextResponse.json({ error: "Failed to delete complaint." }, { status: 500 });
  }
}

