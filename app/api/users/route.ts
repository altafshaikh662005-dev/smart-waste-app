import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Complaint } from "@/models/Complaint";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const users = await User.find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .lean();

    const complaintCounts = await Complaint.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      complaintCounts.map((c) => [c._id?.toString(), c.count])
    );

    const usersWithCount = users.map((u: { _id: { toString: () => string }; complaintIds?: unknown[] }) => ({
      ...u,
      reportCount: countMap.get(u._id.toString()) ?? (u.complaintIds?.length || 0),
    }));

    return NextResponse.json({ users: usersWithCount }, { status: 200 });
  } catch (error) {
    console.error("Get users error", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}
