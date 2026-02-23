import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { Complaint } from "@/models/Complaint";

export const dynamic = "force-dynamic";

/** Public endpoint: returns all complaints with minimal fields for map markers. */
export async function GET() {
  try {
    await connectDB();

    const complaints = await Complaint.find(
      {},
      { _id: 1, latitude: 1, longitude: 1, wasteType: 1, status: 1, priority: 1, description: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });

    return NextResponse.json({ complaints }, { status: 200 });
  } catch (error) {
    console.error("Map complaints error", error);
    return NextResponse.json({ error: "Failed to fetch map data." }, { status: 500 });
  }
}
