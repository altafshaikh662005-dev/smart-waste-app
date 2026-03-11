"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import useSWR from "swr";
import { useAuth } from "@/components/AuthContext";
import {
  FiTrash2,
  FiUsers,
  FiFileText,
  FiShield,
  FiMapPin,
  FiUpload,
  FiCheck,
} from "react-icons/fi";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  reportCount: number;
  createdAt?: string;
}

interface Complaint {
  _id: string;
  description: string;
  wasteType: string;
  status: string;
  priority: string;
  image?: string;
  adminImage?: string;
  latitude?: number;
  longitude?: number;
  completedAt?: string | { $date: string };
  userNotifiedAt?: string | { $date: string };
  createdAt: string | { $date: string };
  userId?: string | { name?: string; email?: string };
}

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error((data as { error?: string }).error || "Failed to load");
  return data;
};

function formatDate(raw: string | { $date: string } | undefined): string {
  if (!raw) return "—";
  const str = typeof raw === "string" ? raw : (raw as { $date: string })?.$date;
  if (!str) return "—";
  const d = new Date(str);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function AdminPage() {
  const { user, loading, refresh, login, logout } = useAuth();
  const [tab, setTab] = useState<"users" | "reports">("users");
  const {
    data: usersData,
    error: usersError,
    mutate: mutateUsers,
  } = useSWR<{ users: UserData[] }>(
    user?.role === "admin" ? "/api/users" : null,
    fetcher,
  );
  const {
    data: complaintsData,
    error: complaintsError,
    mutate,
  } = useSWR<{ complaints: Complaint[] }>(
    user?.role === "admin" ? "/api/complaints?all=true" : null,
    fetcher,
  );
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      toast.error("Enter admin email and password.");
      return;
    }
    setAdminLoggingIn(true);
    try {
      const result = await login(
        adminEmail.trim().toLowerCase(),
        adminPassword,
      );
      if (result.error) {
        toast.error(result.error || "Invalid admin credentials.");
        return;
      }
      // ensure server-side cookie is read and context updated
      await refresh();
      if (!user || user.role !== "admin") {
        await logout();
        toast.error("Admin credentials required.");
        return;
      }
      toast.success("Admin access granted.");
    } finally {
      setAdminLoggingIn(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Update failed.");
        return;
      }
      toast.success("Status updated.");
      mutate();
    } finally {
      setUpdating(null);
    }
  }

  async function uploadAdminImage(id: string, file: File) {
    setUploadingImage(id);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/complaints/${id}/admin-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Upload failed.");
        return;
      }
      toast.success("Image uploaded.");
      mutate();
    } finally {
      setUploadingImage(null);
    }
  }

  async function confirmComplete(id: string) {
    if (
      !confirm(
        "Mark this task as complete and notify the user? The user will see their report is done.",
      )
    )
      return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/complaints/${id}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to confirm.");
        return;
      }
      toast.success("Task marked complete. User has been notified.");
      mutate();
    } finally {
      setUpdating(null);
    }
  }

  async function deleteComplaint(id: string) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Delete failed.");
        return;
      }
      toast.success("Report deleted.");
      mutate();
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="skeleton h-8 w-48 mx-auto mb-4" />
        <div className="skeleton h-4 w-64 mx-auto" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto card p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <FiShield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Admin login</h1>
            <p className="text-sm text-slate-500">
              Enter admin credentials to access the dashboard
            </p>
          </div>
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium mb-1"
            >
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              className="input"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium mb-1"
            >
              Admin password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={adminLoggingIn}
          >
            {adminLoggingIn ? "Signing in…" : "Sign in as admin"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500 text-center">
          <Link href="/" className="text-primary font-medium hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    );
  }

  const users = usersData?.users ?? [];
  const complaints = complaintsData?.complaints ?? [];
  const hasError = usersError || complaintsError;
  const isLoading =
    (!usersData && !usersError) || (!complaintsData && !complaintsError);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin dashboard</h1>
      <p className="text-sm text-slate-500">View users and manage reports.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <span className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FiUsers className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold">
              {isLoading ? "—" : users.length}
            </p>
            <p className="text-sm text-slate-500">Total users</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <span className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FiFileText className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold">
              {isLoading ? "—" : complaints.length}
            </p>
            <p className="text-sm text-slate-500">Total reports</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FiUsers className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "reports"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FiFileText className="h-4 w-4" />
          Reports ({complaints.length})
        </button>
      </div>

      {hasError && (
        <div className="card p-4 flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200">
            Failed to load data.{" "}
            {(usersError as Error)?.message ||
              (complaintsError as Error)?.message ||
              "You may not have admin access."}
          </p>
          <button
            type="button"
            onClick={() => {
              mutateUsers();
              mutate();
            }}
            className="btn-ghost text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {tab === "users" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Points</th>
                  <th className="text-left py-3 px-4">Reports</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${u.role === "admin" ? "badge-priority-high" : "badge-priority-low"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">{u.points}</td>
                    <td className="py-3 px-4">{u.reportCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !usersError && (
            <p className="text-sm text-slate-500 text-center py-8">
              No users yet.
            </p>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4">Image</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Admin Image</th>
                  <th className="text-left py-3 px-4">Confirm</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 px-4">
                      {c.image ? (
                        <a
                          href={c.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90"
                        >
                          <img
                            src={c.image}
                            alt="Report"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">No image</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.userId &&
                      typeof c.userId === "object" &&
                      "name" in c.userId
                        ? ((c.userId as { name?: string }).name ?? "—")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.userId &&
                      typeof c.userId === "object" &&
                      "email" in c.userId
                        ? ((c.userId as { email?: string }).email ?? "—")
                        : "—"}
                    </td>
                    <td className="py-3 px-4">{c.wasteType}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      {c.description}
                    </td>
                    <td className="py-3 px-4">
                      {c.latitude != null && c.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                          title="View on Google Maps"
                        >
                          <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        className="input py-1 text-xs w-32"
                        value={c.status}
                        disabled={updating === c._id}
                        onChange={(e) => updateStatus(c._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge badge-priority-${c.priority}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {c.adminImage ? (
                          <a
                            href={c.adminImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-12 h-12 rounded overflow-hidden border border-slate-200 dark:border-slate-700"
                          >
                            <img
                              src={c.adminImage}
                              alt="Admin proof"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ) : null}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingImage === c._id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadAdminImage(c._id, f);
                              e.target.value = "";
                            }}
                          />
                          <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <FiUpload className="w-3 h-3" />
                            {uploadingImage === c._id
                              ? "Uploading…"
                              : c.adminImage
                                ? "Replace"
                                : "Upload"}
                          </span>
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => confirmComplete(c._id)}
                        disabled={
                          updating === c._id || c.status === "completed"
                        }
                        className="btn-primary text-xs py-1.5 px-2 inline-flex items-center gap-1 disabled:opacity-50"
                        title={
                          c.status === "completed"
                            ? "Already completed"
                            : "Mark complete & notify user"
                        }
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        {c.status === "completed" ? "Done" : "Confirm"}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => deleteComplaint(c._id)}
                        disabled={updating === c._id}
                        className="text-rose-600 hover:text-rose-700 p-1"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {complaints.length === 0 && !complaintsError && (
            <p className="text-sm text-slate-500 text-center py-8">
              No reports yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
