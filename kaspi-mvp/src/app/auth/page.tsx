"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  exportTransactionsToMoneyManagerTsv,
  importTransactionsFromMoneyManagerTsv,
  type DateRangeFilter,
  type DateRangePreset,
} from "@/application/transactions/useCases";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

const RANGE_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "lastM", label: "Last M months" },
  { value: "annually", label: "Annually" },
  { value: "lastY", label: "Last Y years" },
  { value: "total", label: "Total" },
];

type ExchangeFormat = "tsv" | "xlsx" | "xls";

function sanitizeCell(value: unknown): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

function tsvToRows(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => sanitizeCell(cell)));
}

function rowsToTsv(rows: unknown[][]): string {
  return rows
    .map((row) => row.map((cell) => sanitizeCell(cell)).join("\t"))
    .join("\n");
}

export default function AuthPage() {
  const { user, signIn, createAccount, signOut, refreshUser, isLoading, isConfigured, isSyncingAccount } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);
  const [isExchangeBusy, setIsExchangeBusy] = useState(false);
  const [exchangeFormat, setExchangeFormat] = useState<ExchangeFormat>("xlsx");
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("monthly");
  const [rangeValueInput, setRangeValueInput] = useState("3");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "");
  }, [user]);

  const title = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const result =
      mode === "login"
        ? await signIn(email.trim(), password)
        : await createAccount(email.trim(), password, displayName);

    if (result.error) {
      setMessage(result.error);
      setIsSubmitting(false);
      return;
    }

    if (mode === "register") {
      setMessage(
        result.requiresEmailConfirmation
          ? "Account created. Confirm your email to finish sign-in and start sync."
          : "Account created and sync started."
      );
    } else {
      setMessage("Signed in successfully. Sync started.");
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

  const buildDateRangeFilter = (): DateRangeFilter => {
    const parsed = Number.parseInt(rangeValueInput, 10);
    return {
      preset: rangePreset,
      value: Number.isFinite(parsed) ? Math.max(1, parsed) : 1,
    };
  };

  const handleExport = () => {
    void (async () => {
      setIsExchangeBusy(true);
      setExchangeMessage(null);
      try {
        const stamp = new Date().toISOString().slice(0, 10);
        const rangeFilter = buildDateRangeFilter();
        const tsv = await exportTransactionsToMoneyManagerTsv(user?.id, rangeFilter);

        if (exchangeFormat === "tsv") {
          const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `money-manager-import-${stamp}.tsv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          setExchangeMessage("TSV export completed.");
          return;
        }

        const rows = tsvToRows(tsv);
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");

        const bookType = exchangeFormat === "xlsx" ? "xlsx" : "biff8";
        const fileExt = exchangeFormat === "xlsx" ? "xlsx" : "xls";
        const buffer = XLSX.write(workbook, { bookType, type: "array" });
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `money-manager-import-${stamp}.${fileExt}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setExchangeMessage(`${fileExt.toUpperCase()} export completed.`);
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
        const lowerName = file.name.toLowerCase();
        let rawTsv = "";

        if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
          const binary = await file.arrayBuffer();
          const workbook = XLSX.read(binary, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error("Workbook has no sheets");
          }
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
          rawTsv = rowsToTsv(rows as unknown[][]);
        } else {
          rawTsv = await file.text();
        }

        const result = await importTransactionsFromMoneyManagerTsv(rawTsv, user?.id, buildDateRangeFilter());
        setExchangeMessage(`Imported: ${result.imported}. Skipped: ${result.skipped}.`);
      } catch {
        setExchangeMessage("Import failed. Check file format and retry.");
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

        {isSyncingAccount ? (
          <div className="mt-4 rounded-2xl border border-lavender/20 bg-lilac px-4 py-3 text-sm text-lavender">
            Syncing your account data and settings...
          </div>
        ) : null}

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
                Use Money Manager-compatible files with selectable format and date range.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Format
                  <select
                    value={exchangeFormat}
                    onChange={(e) => setExchangeFormat(e.target.value as ExchangeFormat)}
                    className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                  >
                    <option value="tsv">TSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="xls">XLS</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-ink">
                  Period
                  <select
                    value={rangePreset}
                    onChange={(e) => setRangePreset(e.target.value as DateRangePreset)}
                    className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                  >
                    {RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {rangePreset === "lastM" || rangePreset === "lastY" ? (
                <label className="mt-3 grid gap-2 text-sm font-medium text-ink">
                  {rangePreset === "lastM" ? "Number of months" : "Number of years"}
                  <input
                    type="number"
                    min={1}
                    value={rangeValueInput}
                    onChange={(e) => setRangeValueInput(e.target.value)}
                    className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
                  />
                </label>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExchangeBusy}
                  className="rounded-full border border-lavender/25 bg-lilac px-4 py-2 text-sm font-semibold text-lavender transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Export {exchangeFormat.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  disabled={isExchangeBusy}
                  className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-lavender/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Import {exchangeFormat.toUpperCase()}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".tsv,.xlsx,.xls,text/tab-separated-values,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
              {mode === "register" ? (
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
              ) : null}

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
                  minLength={8}
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
