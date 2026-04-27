"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { deleteTransaction, getTransactions, loadCatalogForUser } from "@/application/transactions/useCases";
import { useAuth } from "@/context/AuthContext";
import { EMPTY_USER_CATALOG, getAccounts, type UserCatalog } from "@/domain/transactions/catalog";
import { calculateStats } from "@/domain/transactions/stats";
import type { Transaction, TransactionFilter } from "@/domain/transactions/types";
import { formatDateOnly, formatDateTime, formatKZT, formatMonthLabel } from "@/shared/utils/formatters";

const FILTERS: TransactionFilter[] = ["all", "income", "expense", "transfer"];
type CalendarMode = "all" | "day" | "month";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthIso(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function HistoryPage() {
  const { user, isLoading } = useAuth();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("all");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedMonth, setSelectedMonth] = useState(monthIso());
  const [tick, setTick] = useState(0);
  const [catalog, setCatalog] = useState<UserCatalog>(EMPTY_USER_CATALOG);
  const [allByFilter, setAllByFilter] = useState<Transaction[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const nextCatalog = await loadCatalogForUser(user?.id);
      setCatalog(nextCatalog);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (isLoading) return;
    void (async () => {
      const loaded = await getTransactions(filter, user?.id);
      setAllByFilter(loaded);
    })();
  }, [filter, tick, user?.id, isLoading]);

  const accounts = useMemo(() => getAccounts(catalog), [catalog]);

  const transactions = useMemo(() => {
    const base = selectedAccountId === "all" ? allByFilter : allByFilter.filter((item) => item.accountId === selectedAccountId);
    if (calendarMode === "day") {
      return base.filter((item) => item.date === selectedDate);
    }
    if (calendarMode === "month") {
      return base.filter((item) => item.date.startsWith(selectedMonth));
    }
    return base;
  }, [allByFilter, selectedAccountId, calendarMode, selectedDate, selectedMonth]);

  const stats = useMemo(() => calculateStats(transactions), [transactions]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    void (async () => {
      setDeletingId(id);
      setAllByFilter((prev) => prev.filter((tx) => tx.id !== id));
      try {
        await deleteTransaction(id, user?.id);
        setTick((t) => t + 1);
        setToastMessage("Transaction deleted successfully");
        setTimeout(() => setToastMessage(null), 2000);
      } catch (error) {
        console.error("Delete failed:", error);
        // Restore server/local truth when delete fails.
        setTick((t) => t + 1);
        setToastMessage("Failed to delete transaction");
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setDeletingId(null);
      }
    })();
  };

  return (
    <div className="space-y-6 pb-8">
      {toastMessage && (
        <div className="fixed top-4 right-4 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-card animate-rise z-50">
          {toastMessage}
        </div>
      )}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <StatsCard label="income" value={stats.income} tone="income" />
        <StatsCard label="expense" value={stats.expense} tone="expense" />
        <StatsCard label="transfer (with commission)" value={stats.transferWithCommission} tone="neutral" />
        <StatsCard label="balance" value={stats.balance} tone="balance" />
        <StatsCard label="profit" value={stats.profit} tone="income" />
        <StatsCard label="deficit" value={stats.deficit} tone="expense" />
      </section>

      <section className="grid gap-6">
        <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card md:p-7">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Filters</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Transaction history</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 md:items-center">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      filter === item
                        ? "border-lavender/25 bg-lilac text-lavender shadow-card"
                        : "border-sand bg-cloud text-slate hover:border-lavender/15 hover:text-ink"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
              >
                <option value="all">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5 grid gap-3 rounded-[20px] bg-cloud p-4 md:grid-cols-[auto_auto_1fr] md:items-center">
            <div className="flex flex-wrap gap-2">
              {(["all", "day", "month"] as CalendarMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarMode(mode)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    calendarMode === mode ? "border-lavender/25 bg-lilac text-lavender" : "border-sand bg-white text-slate"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {calendarMode === "day" ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              />
            ) : null}

            {calendarMode === "month" ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              />
            ) : null}

            <p className="text-sm text-slate">
              {calendarMode === "all"
                ? "Showing all dates"
                : calendarMode === "day"
                  ? `Selected day: ${formatDateOnly(selectedDate)}`
                  : `Selected month: ${formatMonthLabel(selectedMonth)}`}
            </p>
          </div>

          <div className="space-y-3">
            {!transactions.length ? (
              <p className="rounded-[22px] bg-cloud px-4 py-5 text-sm text-slate">История пока пустая.</p>
            ) : (
              transactions.map((tx) => (
                <article
                  key={tx.id}
                  className="grid gap-3 rounded-[24px] border border-sand bg-cloud p-4 md:grid-cols-[105px_minmax(0,1fr)_120px_130px_auto] md:items-center md:p-5"
                >
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate">{tx.type}</span>
                  <div>
                    <p className="line-clamp-2 text-sm leading-6 text-ink">{tx.note || tx.rawText}</p>
                    <p className="mt-1 text-xs text-slate">
                      {tx.accountName} • {tx.categoryName}
                      {tx.subcategory ? ` / ${tx.subcategory}` : ""}
                    </p>
                  </div>
                  <strong className="text-sm font-semibold text-ink">{formatKZT(tx.amount)}</strong>
                  <time className="text-xs text-slate">
                    {formatDateOnly(tx.date)}
                    <br />
                    {formatDateTime(tx.createdAt)}
                  </time>
                  <button
                    type="button"
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    className="rounded-full border border-[#f3c3b7] px-3 py-1.5 text-xs font-semibold text-[#ad5f47] transition hover:bg-[#fff1ec]"
                  >
                    {deletingId === tx.id ? "Удаление..." : "Удалить"}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
