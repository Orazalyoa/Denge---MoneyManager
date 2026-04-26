"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/SidebarNav";
import { useAuth } from "@/context/AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full px-3 py-4 md:px-5 md:py-6 xl:px-6">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-card lg:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
          className="rounded-xl border border-sand px-3 py-2 text-sm font-semibold text-ink"
        >
          Menu
        </button>
        <p className="text-base font-semibold text-ink">Denge</p>
        <Link
          href="/auth"
          className="rounded-xl border border-lavender/20 bg-lilac px-3 py-2 text-sm font-semibold text-lavender"
        >
          {user ? "Profile" : "Auth"}
        </Link>
      </div>

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-6">
        <div
          className={`fixed left-0 top-0 z-50 h-full w-[86vw] max-w-[320px] bg-transparent p-3 transition-transform duration-200 lg:static lg:h-auto lg:w-auto lg:max-w-none lg:p-0 lg:transition-none ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="mb-2 flex justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
              className="rounded-xl border border-sand bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              Close
            </button>
          </div>
          <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
