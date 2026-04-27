"use client";

import { useEffect, useMemo, useState } from "react";
import { getTransactions } from "@/application/transactions/useCases";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { calculateStats } from "@/domain/transactions/stats";
import type { Transaction } from "@/domain/transactions/types";
import { formatDateOnly, formatKZT, formatMonthLabel } from "@/shared/utils/formatters";

function monthIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthCells(monthValue: string): Array<{ date: string; inMonth: boolean }> {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return [];

  const first = new Date(year, month - 1, 1);
  const firstWeekDay = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month, 0).getDate();

  const cells: Array<{ date: string; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekDay; i += 1) {
    const d = new Date(year, month - 1, i - firstWeekDay + 1);
    cells.push({ date: isoDate(d), inMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const d = new Date(year, month - 1, day);
    cells.push({ date: isoDate(d), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const offset = cells.length - (firstWeekDay + totalDays) + 1;
    const d = new Date(year, month - 1, totalDays + offset);
    cells.push({ date: isoDate(d), inMonth: false });
  }

  return cells;
}

export default function CalendarPage() {
  const { user, isLoading } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthIso(today));
  const [selectedDate, setSelectedDate] = useState(isoDate(today));
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isLoading) return;
    void (async () => {
      const loaded = await getTransactions("all", user?.id);
      setAllTransactions(loaded);
    })();
  }, [user?.id, isLoading]);

  const monthCells = useMemo(() => buildMonthCells(selectedMonth), [selectedMonth]);

  const byDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of allTransactions) {
      const list = map.get(tx.date) ?? [];
      list.push(tx);
      map.set(tx.date, list);
    }
    return map;
  }, [allTransactions]);

  const selectedTransactions = useMemo(() => byDate.get(selectedDate) ?? [], [byDate, selectedDate]);
  const selectedStats = useMemo(() => calculateStats(selectedTransactions), [selectedTransactions]);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-card md:p-7">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Calendar</p>
            <h1 className="mt-2 text-xl font-semibold text-ink">Monthly view</h1>
            <p className="mt-1 text-sm text-slate">Tap a date to load transactions for that day.</p>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
          />
        </div>

        <p className="mb-3 text-sm text-slate">{formatMonthLabel(selectedMonth)}</p>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {monthCells.map((cell) => {
            const isActive = cell.date === selectedDate;
            const hasData = (byDate.get(cell.date)?.length ?? 0) > 0;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`rounded-xl border px-1 py-2 text-xs transition ${
                  isActive
                    ? "border-lavender/25 bg-lilac text-lavender"
                    : cell.inMonth
                      ? "border-sand bg-white text-ink"
                      : "border-sand/50 bg-cloud text-slate"
                }`}
              >
                <div>{Number(cell.date.slice(-2))}</div>
                {hasData ? <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <div className="mt-1 h-1.5" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatsCard label="income" value={selectedStats.income} tone="income" />
        <StatsCard label="expense" value={selectedStats.expense} tone="expense" />
        <StatsCard label="balance" value={selectedStats.balance} tone="balance" />
        <StatsCard label="items" value={selectedTransactions.length} tone="neutral" format="number" />
      </section>

      <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-card md:p-7">
        <h2 className="text-lg font-semibold text-ink">Selected date: {formatDateOnly(selectedDate)}</h2>
        {selectedTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No transactions for this date.</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {selectedTransactions.map((tx) => (
              <article key={tx.id} className="rounded-2xl border border-sand bg-cloud px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">{tx.type}</p>
                <p className="mt-1 text-sm text-ink">{tx.note || tx.rawText}</p>
                <p className="mt-1 text-xs text-slate">{tx.accountName} • {tx.categoryName}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{formatKZT(tx.amount)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
