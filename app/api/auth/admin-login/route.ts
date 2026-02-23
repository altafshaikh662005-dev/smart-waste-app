import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const adminId = process.env.ADMIN_ID?.trim().toLowerCase() ?? "";
    const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

    if (!adminId || !adminPassword) {
      return NextResponse.json(
        { error: "Admin login is not configured." },
        { status: 503 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Admin ID and password are required." },
        { status: 400 }
      );
    }

    const trimmedPassword = password.trim();
    if (email !== adminId || trimmedPassword !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error("Admin login DB error", dbError);
      return NextResponse.json(
        { error: "Database unavailable. Please try again later." },
        { status: 503 }
      );
    }

    let user = await User.findOne({ email: adminId });
    if (!user) {
      user = await User.create({
        name: "Admin",
        email: adminId,
        password: await hashPassword(adminPassword),
        role: "admin",
        points: 0,
      });
    } else if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = signToken(user);

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error", error);
    return NextResponse.json(
      { error: "Failed to log in as admin." },
      { status: 500 }
    );
  }
}
