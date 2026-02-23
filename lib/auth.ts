import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { IUser, User } from "@/models/User";
import { connectDB } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-smart-waste-secret";

export interface AuthTokenPayload {
  id: string;
  role: string;
  email: string;
}

/** Get JWT from cookie (preferred) or Authorization header */
export async function getTokenFromRequest(request: Request): Promise<string | null> {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get("token")?.value;
  if (cookieToken) return cookieToken;
  const authHeader = (request as Request).headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export function signToken(user: IUser) {
  const payload: AuthTokenPayload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUserFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.id);
  return user;
}

