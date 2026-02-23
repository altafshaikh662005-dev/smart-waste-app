"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import { complaintGet, ComplaintDto } from "@/lib/api";
import { FiMapPin, FiArrowLeft } from "react-icons/fi";

const statusClass: Record<string, string> = {
  pending: "badge-status-pending",
  "in-progress": "badge-status-in-progress",
  completed: "badge-status-completed",
};
const priorityClass: Record<string, string> = {
  low: "badge-priority-low",
  medium: "badge-priority-medium",
  high: "badge-priority-high",
};

export default function ReportDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [complaint, setComplaint] = useState<ComplaintDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Please log in.");
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    complaintGet(id)
      .then((data) => setComplaint(data.complaint))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load report");
        router.push("/user");
      })
      .finally(() => setLoading(false));
  }, [id, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-8">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  const raw = complaint.createdAt;
  const dateStr =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "$date" in raw
        ? (raw as { $date: string }).$date
        : "";
  let date = "—";
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      date = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/user"
        className="btn-ghost inline-flex items-center gap-2 text-sm mb-4"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to My Reports
      </Link>

      <div className="card p-6 space-y-6">
        <h1 className="text-xl font-semibold">Report details</h1>
        <div className="flex flex-wrap gap-2">
          <span className={statusClass[complaint.status]}>{complaint.status}</span>
          <span className={priorityClass[complaint.priority]}>
            {complaint.priority} priority
          </span>
          <span className="badge badge-priority-low">{complaint.wasteType}</span>
        </div>
        <p className="text-slate-700 dark:text-slate-200">{complaint.description}</p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FiMapPin className="h-4 w-4" />
          {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
        </div>
        {complaint.aiTips && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Recycling tip</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {complaint.aiTips}
            </p>
          </div>
        )}
        {complaint.image && (
          <div>
            <p className="text-sm font-medium mb-2">Your photo</p>
            <img
              src={complaint.image}
              alt="Report"
              className="rounded-lg max-h-80 w-full object-contain border border-slate-200 dark:border-slate-700"
            />
          </div>
        )}
        {complaint.adminImage && (
          <div>
            <p className="text-sm font-medium mb-2">Admin&apos;s completion image</p>
            <a
              href={complaint.adminImage}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-md"
            >
              <img
                src={complaint.adminImage}
                alt="Admin completion proof"
                className="w-full max-h-80 object-contain"
              />
            </a>
          </div>
        )}
        {complaint.status === "completed" && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Task completed
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Your report has been resolved. Thank you for helping keep our community clean!
            </p>
          </div>
        )}
        <p className="text-xs text-slate-500">Submitted on {date}</p>
      </div>
    </div>
  );
}
