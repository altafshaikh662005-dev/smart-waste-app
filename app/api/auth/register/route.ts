import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { isValidEmail, isNonEmpty } from "@/lib/validators";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    const role = body?.role === "admin" ? "admin" : "user";

    if (!isNonEmpty(name) || !isNonEmpty(email) || !isNonEmpty(password)) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password should be at least 6 characters long." },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error("Register DB error", dbError);
      return NextResponse.json(
        { error: "Database unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role
    });

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
      { status: 201 }
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
    console.error("Register error", error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}

