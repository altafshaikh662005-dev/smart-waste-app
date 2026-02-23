"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMapPin, FiPlusCircle, FiShield, FiTrendingUp, FiFileText } from "react-icons/fi";

export default function HomePage() {
  const [role, setRole] = useState<"user" | "admin">("user");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.4fr,1fr] items-start">
        <div className="card p-6 md:p-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 text-xs font-medium dark:bg-emerald-900/40 dark:text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            AI-powered smart waste management
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Report garbage, optimize routes,{" "}
              <span className="text-primary">clean cities smarter.</span>
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl">
              Citizens can instantly report overflowing bins with GPS and photos. Admins get an
              AI-assisted command center for routing vehicles, tracking complaints, and rewarding
              participation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/report" className="btn-primary inline-flex">
              <FiPlusCircle className="mr-2" />
              Report garbage
            </Link>
            <Link href="/map" className="btn-outline inline-flex">
              <FiMapPin className="mr-2" />
              View map
            </Link>
            <Link href="/user" className="btn-outline inline-flex">
              <FiFileText className="mr-2" />
              My Reports
            </Link>
            <Link href="/admin" className="btn-ghost inline-flex">
              <FiShield className="mr-2" />
              Admin dashboard
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <FiMapPin className="text-primary" />
                GPS-enabled reporting
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Auto-detect user location, cluster complaints on an interactive map.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <FiTrendingUp className="text-primary" />
                AI-powered prioritization
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Classify waste, suggest recycling tips, and optimize pickup routes by density.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary font-semibold">
                  ★
                </span>
                Rewards for clean citizens
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Residents earn points for actionable reports, redeemable for local benefits.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Quick access
              </span>
              <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    role === "user"
                      ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                      : "text-slate-500"
                  }`}
                  onClick={() => setRole("user")}
                >
                  User
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    role === "admin"
                      ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                      : "text-slate-500"
                  }`}
                  onClick={() => setRole("admin")}
                >
                  Admin
                </button>
              </div>
            </div>
            {role === "user" ? (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Sign up or log in as a citizen</li>
                <li>2. Allow location access and upload a photo of the garbage</li>
                <li>3. Select waste type and submit complaint</li>
                <li>4. Track status and earn reward points</li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Log in as admin</li>
                <li>2. View clustered complaints on the city map</li>
                <li>3. Assign vehicles and use AI route optimization</li>
                <li>4. Monitor KPIs from the analytics dashboard</li>
              </ul>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
            <div className="card p-3">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                2.3k+
              </div>
              <div>Complaints resolved</div>
            </div>
            <div className="card p-3">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                18%
              </div>
              <div>Route time saved</div>
            </div>
            <div className="card p-3">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                4.8★
              </div>
              <div>User satisfaction</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

