import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { isValidEmail, isNonEmpty } from "@/lib/validators";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isNonEmpty(email) || !isNonEmpty(password)) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const adminId = (process.env.ADMIN_ID ?? "").trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

    if (adminId && adminPassword && email === adminId && password.trim() === adminPassword) {
      try {
        await connectDB();
      } catch (dbError) {
        console.error("Login DB error", dbError);
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
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error("Login DB error", dbError);
      return NextResponse.json(
        { error: "Database unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signToken(user);

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points
        },
        token
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}

