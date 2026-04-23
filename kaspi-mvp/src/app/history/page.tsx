"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { StatsCard } from "@/components/StatsCard";
import { getTransactions, getTransactionStats } from "@/application/transactions/useCases";
import type { TransactionFilter } from "@/domain/transactions/types";
import { formatDateTime, formatKZT } from "@/shared/utils/formatters";

const FILTERS: TransactionFilter[] = ["all", "income", "expense", "transfer"];

export default function HistoryPage() {
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const transactions = useMemo(() => getTransactions(filter), [filter]);
  const stats = useMemo(() => getTransactionStats(), []);

  return (
    <div className="space-y-6">
      <AppHeader />

      <section className="grid gap-4 md:grid-cols-4">
        <StatsCard label="income" value={stats.income} tone="income" />
        <StatsCard label="expense" value={stats.expense} tone="expense" />
        <StatsCard label="transfer" value={stats.transfer} tone="neutral" />
        <StatsCard label="balance" value={stats.balance} tone="balance" />
      </section>

      <section className="rounded-xl2 border border-ink/15 bg-white/70 p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-4 py-1 text-sm transition ${
                filter === item
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/30 bg-transparent text-ink hover:bg-ink/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {!transactions.length ? (
            <p className="text-sm text-ink/70">История пока пустая.</p>
          ) : (
            transactions.map((tx) => (
              <article
                key={tx.id}
                className="grid gap-2 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-[120px_1fr_120px_180px] md:items-center"
              >
                <span className="text-xs uppercase tracking-wide text-ink/70">{tx.type}</span>
                <p className="line-clamp-1 text-sm text-ink/90">{tx.rawText}</p>
                <strong className="text-sm text-ink">{formatKZT(tx.amount)}</strong>
                <time className="text-xs text-ink/70">{formatDateTime(tx.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
