"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PasteBox } from "@/components/PasteBox";
import { StatsCard } from "@/components/StatsCard";
import { TransactionPreviewList } from "@/components/TransactionPreviewList";
import { parseDraftTransactions, saveDraftTransactions } from "@/application/transactions/useCases";
import type { DraftTransaction } from "@/domain/transactions/types";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<DraftTransaction[]>([]);
  const [message, setMessage] = useState<string>("");

  const parseSummary = useMemo(() => {
    const income = drafts.filter((d) => d.type === "income").reduce((acc, cur) => acc + cur.amount, 0);
    const expense = drafts.filter((d) => d.type === "expense").reduce((acc, cur) => acc + cur.amount, 0);
    return { income, expense, total: drafts.length };
  }, [drafts]);

  const handleParse = () => {
    const parsed = parseDraftTransactions(input);
    setDrafts(parsed);
    setMessage(parsed.length ? `Parsed: ${parsed.length}` : "Не удалось распознать транзакции");
  };

  const handleSave = () => {
    if (!drafts.length) return;
    saveDraftTransactions(drafts);
    setDrafts([]);
    setInput("");
    setMessage("Сохранено в localStorage");
  };

  const handleAmountChange = (id: string, amount: number) => {
    setDrafts((prev) => prev.map((item) => (item.id === id ? { ...item, amount: Math.max(0, amount || 0) } : item)));
  };

  const handleTypeChange = (id: string, type: DraftTransaction["type"]) => {
    setDrafts((prev) => prev.map((item) => (item.id === id ? { ...item, type } : item)));
  };

  const handleDelete = (id: string) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <AppHeader />

      <section className="grid gap-4 md:grid-cols-3">
        <StatsCard label="draft income" value={parseSummary.income} tone="income" />
        <StatsCard label="draft expense" value={parseSummary.expense} tone="expense" />
        <StatsCard label="parsed items" value={parseSummary.total} tone="neutral" />
      </section>

      <PasteBox value={input} onChange={setInput} onParse={handleParse} isDisabled={!input.trim()} />

      {message ? (
        <p className="rounded-lg border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink">{message}</p>
      ) : null}

      <TransactionPreviewList
        transactions={drafts}
        onAmountChange={handleAmountChange}
        onTypeChange={handleTypeChange}
        onDelete={handleDelete}
        onConfirm={handleSave}
      />
    </div>
  );
}
