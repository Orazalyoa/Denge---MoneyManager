"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  exportTransactionsToMoneyManagerTsv,
  importTransactionsFromMoneyManagerTsv,
} from "@/application/transactions/useCases";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const { user, signIn, signUp, signOut, refreshUser, isLoading, isConfigured } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);
  const [isExchangeBusy, setIsExchangeBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "");
  }, [user]);

  const title = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const action = mode === "login" ? signIn : signUp;
    const { error } = await action(email.trim(), password);

    if (error) {
      setMessage(error);
      setIsSubmitting(false);
      return;
    }

    if (mode === "register") {
      setMessage("Account created. Check your email if confirmation is required.");
    } else {
      setMessage("Signed in successfully.");
    }

    setIsSubmitting(false);
  };

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase || !user) return;

    setMessage(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName.trim(),
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await refreshUser();
    setMessage("Profile updated.");
    setIsSubmitting(false);
  };

  const handleExport = () => {
    void (async () => {
      setIsExchangeBusy(true);
      setExchangeMessage(null);
      try {
        const tsv = await exportTransactionsToMoneyManagerTsv(user?.id);
        const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
        const stamp = new Date().toISOString().slice(0, 10);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `money-manager-import-${stamp}.tsv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setExchangeMessage("TSV export completed.");
      } catch {
        setExchangeMessage("Export failed. Please retry.");
      } finally {
        setIsExchangeBusy(false);
      }
    })();
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      setIsExchangeBusy(true);
      setExchangeMessage(null);
      try {
        const raw = await file.text();
        const result = await importTransactionsFromMoneyManagerTsv(raw, user?.id);
        setExchangeMessage(`Imported: ${result.imported}. Skipped: ${result.skipped}.`);
      } catch {
        setExchangeMessage("Import failed. Check TSV format and retry.");
      } finally {
        setIsExchangeBusy(false);
        event.target.value = "";
      }
    })();
  };

  if (!isConfigured) {
    return (
      <section className="mx-auto max-w-xl rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-ink">Auth setup required</h1>
        <p className="mt-3 text-sm leading-6 text-slate">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment to enable registration and
          login.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="mx-auto max-w-xl rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-card md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Cloud account</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{user ? "Profile" : title}</h1>
        <p className="mt-2 text-sm text-slate">
          {user
            ? "Manage your account here."
            : "Sign in once to keep transactions and parser settings synced across devices."}
        </p>

        {user ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-lavender/20 bg-lilac px-4 py-3 text-sm text-lavender">
              Signed in: {user.email || "account"}
            </div>

            <form className="grid gap-4" onSubmit={handleProfileSave}>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Display name
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : "Save profile"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-2xl border border-[#f3c3b7] px-4 py-3 text-sm font-semibold text-[#ad5f47] transition hover:bg-[#fff1ec]"
            >
              Logout
            </button>

            <section className="rounded-2xl border border-sand bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Data exchange</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">Export / import</h2>
              <p className="mt-2 text-sm text-slate">
                Use TSV compatible with Money Manager import flow.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExchangeBusy}
                  className="rounded-full border border-lavender/25 bg-lilac px-4 py-2 text-sm font-semibold text-lavender transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Export TSV
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  disabled={isExchangeBusy}
                  className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-lavender/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Import TSV
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".tsv,text/tab-separated-values,text/plain"
                  className="hidden"
                  onChange={handleImportFileChange}
                />
              </div>

              {exchangeMessage ? <p className="mt-3 text-sm text-slate">{exchangeMessage}</p> : null}
            </section>
          </div>
        ) : (
          <>
            <div className="mt-5 inline-flex rounded-full border border-sand bg-cloud p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-ink shadow-card" : "text-slate"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-white text-ink shadow-card" : "text-slate"
                }`}
              >
                Register
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-ink">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
          </>
        )}

        {message ? <p className="mt-4 text-sm text-slate">{message}</p> : null}
      </section>
    </div>
  );
}
