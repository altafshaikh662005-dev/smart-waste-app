"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import useSWR from "swr";
import { FiPlusCircle, FiAward } from "react-icons/fi";
import ReportForm from "@/components/ReportForm";
import ComplaintCard from "@/components/ComplaintCard";
import { complaintsGet, ComplaintDto } from "@/lib/api";

const fetcher = () => complaintsGet().then((r) => r.complaints);

export default function UserPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: complaints = [], mutate } = useSWR<ComplaintDto[]>(
    user ? "user-complaints" : null,
    fetcher
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Please log in.");
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Citizen dashboard</h1>
          <p className="text-slate-500">Report garbage and track your complaints</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <FiAward className="h-5 w-5 text-primary" />
          <span className="font-medium">{user.points} points</span>
        </div>
      </div>

      <ReportForm onSuccess={() => mutate()} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">My reports</h2>
        {complaints.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <FiPlusCircle className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p>No reports yet. Submit one above to get started.</p>
            <Link href="/" className="mt-2 inline-block text-sm text-primary hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {complaints.map((c) => (
              <li key={String(c._id)}>
                <ComplaintCard
                  complaint={c}
                  href={`/user/reports/${String(c._id)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
