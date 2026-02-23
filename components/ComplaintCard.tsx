"use client";

import { useRouter } from "next/navigation";
import { ComplaintDto } from "@/lib/api";
import { FiMapPin, FiTrash2 } from "react-icons/fi";

interface ComplaintCardProps {
  complaint: ComplaintDto;
  onStatusChange?: (id: string, status: ComplaintDto["status"]) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  /** If set, clicking the card navigates to this report detail page */
  href?: string;
}

const statusClass: Record<ComplaintDto["status"], string> = {
  pending: "badge-status-pending",
  "in-progress": "badge-status-in-progress",
  completed: "badge-status-completed",
};
const priorityClass: Record<ComplaintDto["priority"], string> = {
  low: "badge-priority-low",
  medium: "badge-priority-medium",
  high: "badge-priority-high",
};

export default function ComplaintCard({
  complaint,
  onStatusChange,
  onDelete,
  showActions = false,
  href,
}: ComplaintCardProps) {
  const router = useRouter();
  const raw = complaint.createdAt;
  const dateStr =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "$date" in raw
        ? (raw as { $date: string }).$date
        : "";
  let date = "—";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) {
        date = d.toLocaleDateString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
    } catch {
      date = "—";
    }
  }

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={statusClass[complaint.status]}>{complaint.status}</span>
        <span className={priorityClass[complaint.priority]}>{complaint.priority}</span>
        <span className="text-xs text-slate-500">{complaint.wasteType}</span>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-200">{complaint.description}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <FiMapPin className="h-3.5 w-3.5" />
        {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
      </div>
      {complaint.aiTips && (
        <p className="text-xs text-slate-600 dark:text-slate-400 border-l-2 border-primary/50 pl-2">
          {complaint.aiTips}
        </p>
      )}
      {complaint.image && (
        <img
          src={complaint.image}
          alt="Report"
          className="rounded-lg h-24 object-cover w-full max-w-[200px]"
        />
      )}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">{date}</span>
        {showActions && (
          <div className="flex items-center gap-2">
            {complaint.status !== "in-progress" && (
              <button
                type="button"
                className="text-xs text-sky-600 hover:underline"
                onClick={() => onStatusChange?.(complaint._id, "in-progress")}
              >
                Start
              </button>
            )}
            {complaint.status !== "completed" && (
              <button
                type="button"
                className="text-xs text-emerald-600 hover:underline"
                onClick={() => onStatusChange?.(complaint._id, "completed")}
              >
                Complete
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-red-600"
                onClick={() => onDelete(complaint._id)}
                aria-label="Delete"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cardClass = "card p-4 space-y-3" + (href ? " hover:border-primary/50 transition cursor-pointer" : "");

  if (href) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cardClass}
        onClick={() => router.push(href)}
        onKeyDown={(e) => e.key === "Enter" && router.push(href)}
      >
        {content}
      </div>
    );
  }
  return <div className={cardClass}>{content}</div>;
}
