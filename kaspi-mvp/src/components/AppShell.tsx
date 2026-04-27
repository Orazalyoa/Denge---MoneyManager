"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/SidebarNav";
import { useAuth } from "@/context/AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const quickTabs = [
    { href: "/", label: "Dashboard" },
    { href: "/history", label: "History" },
    { href: "/calendar", label: "Calendar" },
  ];

  return (
    <div className="min-h-screen w-full px-3 pb-4 pt-2 md:px-5 md:pb-6 md:pt-3 xl:px-6">
      <div className="sticky top-2 z-40 mb-3 rounded-2xl border border-white/70 bg-white/95 px-3 py-3 shadow-card backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
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
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              pathname === "/auth" || pathname.startsWith("/auth/")
                ? "border border-lavender/20 bg-lilac text-lavender"
                : "border border-sand text-ink"
            }`}
          >
            {user ? "Profile" : "Auth"}
          </Link>
        </div>

        <nav className="mt-3 grid grid-cols-3 gap-2">
          {quickTabs.map((tab) => {
            const isActive = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
                  isActive
                    ? "border border-lavender/20 bg-lilac text-lavender"
                    : "border border-sand bg-white text-slate"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
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
