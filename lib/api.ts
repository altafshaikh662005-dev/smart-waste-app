import { getStoredToken } from "./auth-context";

const BASE = "";

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const token = getStoredToken();
  const headers: HeadersInit = {
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const fetchBody: BodyInit | undefined =
    body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    credentials: "include",
    body: fetchBody,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export interface ComplaintDto {
  _id: string;
  userId: string;
  image?: string;
  adminImage?: string;
  wasteType: string;
  description: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  aiTips?: string;
  completedAt?: string | { $date: string };
  userNotifiedAt?: string | { $date: string };
  createdAt: string;
  updatedAt: string;
}

export function complaintsGet(all?: boolean): Promise<{ complaints: ComplaintDto[] }> {
  return api(`/api/complaints${all ? "?all=true" : ""}`);
}

export function complaintGet(id: string): Promise<{ complaint: ComplaintDto }> {
  return api(`/api/complaints/${id}`);
}

export function complaintCreate(form: FormData): Promise<{ complaint: ComplaintDto }> {
  return api("/api/complaints", { method: "POST", body: form });
}

export function complaintUpdateStatus(id: string, status: ComplaintDto["status"]): Promise<{ complaint: ComplaintDto }> {
  return api(`/api/complaints/${id}`, { method: "PATCH", body: { status } });
}

export function complaintDelete(id: string): Promise<{ success: boolean }> {
  return api(`/api/complaints/${id}`, { method: "DELETE" });
}
