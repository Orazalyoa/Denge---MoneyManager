"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface SidebarNavProps {
  className?: string;
  onNavigate?: () => void;
}

export function SidebarNav({ className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, isLoading, signOut, isConfigured } = useAuth();
  const navItems = [
    { href: "/", label: "Dashboard", caption: "Paste and review", mobileHidden: false },
    { href: "/history", label: "History", caption: "Saved activity", mobileHidden: false },
    ...(user
      ? [{ href: "/auth", label: "Profile", caption: "Manage account", mobileHidden: true }]
      : [{ href: "/auth", label: "Auth", caption: "Login or register", mobileHidden: true }]),
  ];
  const displayName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";

  return (
    <aside className={`rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-card backdrop-blur lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:p-6 ${className || ""}`}>
      <div className="flex items-center gap-3 rounded-[20px] bg-gradient-to-br from-lilac via-white to-[#fff0eb] p-4 shadow-float">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lavender text-lg font-bold text-white">
          D
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">Denge</p>
        </div>
      </div>

      <nav className="mt-6 grid gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`${item.mobileHidden ? "hidden lg:block " : ""}${
                isActive
                  ? "rounded-[18px] border border-lavender/20 bg-lilac px-4 py-3 shadow-card transition"
                  : "rounded-[18px] border border-transparent px-4 py-3 transition hover:border-lavender/15 hover:bg-cloud"
              }`}
            >
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-slate">{item.caption}</p>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-[18px] border border-sand bg-cloud p-4">
        {!isConfigured ? (
          <p className="text-xs leading-5 text-slate">
            Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-slate">Checking session...</p>
        ) : user ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Signed in</p>
              <p className="mt-1 break-all text-sm font-medium text-ink">{user.email || "Account"}</p>
              {displayName ? <p className="mt-1 text-xs text-slate">Name: {displayName}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-full border border-[#f3c3b7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#ad5f47] transition hover:bg-[#fff1ec]"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate">Use one account across devices.</p>
            <Link
              href="/auth"
              className="block rounded-full border border-lavender/20 bg-lilac px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-lavender transition hover:brightness-95"
            >
              Open Auth
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}