import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthContext";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Smart Waste-To-Resources System",
  description:
    "A smart platform for waste reporting and efficient waste collection management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <div className="min-h-screen flex flex-col">
              <header className="border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                  <a href="/" className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                      SW
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        Smart Waste-To-Resources System{" "}
                      </span>
                      <span className="text-xs text-slate-500">
                        Smart waste reporting and collection platform
                      </span>
                    </div>
                  </a>
                  <Nav />
                </div>
              </header>
              <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
                {children}
              </main>
              <footer className="border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 py-4 text-center">
                &copy; {new Date().getFullYear()} Smart Waste Management. All
                rights reserved.
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
