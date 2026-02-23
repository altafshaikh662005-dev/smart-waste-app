"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { FiHome, FiMap, FiPlusCircle, FiLogIn, FiLogOut, FiShield, FiSun, FiMoon, FiFileText } from "react-icons/fi";
import { useAuth } from "./AuthContext";

export default function Nav() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      <Link href="/" className="btn-ghost flex items-center gap-1.5 text-sm">
        <FiHome /> Home
      </Link>
      <Link href="/map" className="btn-ghost flex items-center gap-1.5 text-sm">
        <FiMap /> Map
      </Link>
      <Link href="/admin" className="btn-ghost flex items-center gap-1.5 text-sm">
        <FiShield /> Admin
      </Link>
      {!loading && (
        <>
          {user ? (
            <>
              <Link href="/report" className="btn-ghost flex items-center gap-1.5 text-sm">
                <FiPlusCircle /> Report
              </Link>
              <Link href="/user" className="btn-ghost flex items-center gap-1.5 text-sm">
                <FiFileText /> My Reports
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <FiLogOut /> Logout
              </button>
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
                {user.name} ({user.points} pts)
              </span>
            </>
          ) : (
            <Link href="/login" className="btn-ghost flex items-center gap-1.5 text-sm">
              <FiLogIn /> Login
            </Link>
          )}
        </>
      )}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="btn-ghost p-2 rounded-lg"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
      </button>
    </nav>
  );
}
