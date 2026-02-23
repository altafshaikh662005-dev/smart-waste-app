import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { Complaint } from "@/models/Complaint";
import { User } from "@/models/User";

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

    await connectDB();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const now = new Date();
    const wasCompleted = complaint.status === "completed";
    const update: Record<string, unknown> = {
      status: "completed",
      completedAt: now,
      userNotifiedAt: now,
    };

    const updated = await Complaint.findByIdAndUpdate(id, update, { new: true });

    if (complaint.userId && !wasCompleted) {
      await User.findByIdAndUpdate(complaint.userId, {
        $inc: { points: 10 },
      });
    }

    return NextResponse.json(
      {
        complaint: updated,
        message: "Task marked complete. User has been notified.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Confirm completion error", error);
    return NextResponse.json({ error: "Failed to confirm." }, { status: 500 });
  }
}
