"use client";

import { useMemo, useState } from "react";
import type { DraftTransaction, TransactionType } from "@/domain/transactions/types";
import {
  getAccounts,
  getCategories,
  getDefaultCategoryIdWithCatalog,
  getSubcategories,
  type AccountKind,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import { evaluateMathExpression } from "@/shared/utils/math";
import { InlineAddSelect } from "@/components/InlineAddSelect";

interface ManualEntryPanelProps {
  onSave: (draft: DraftTransaction) => Promise<void>;
  onAddCategory: (type: TransactionType, name: string) => string | null;
  onAddAccount: (name: string, kind?: AccountKind) => string | null;
  onAddSubcategory: (type: TransactionType, categoryId: string, name: string) => string | null;
  noteSuggestions: string[];
  catalog: UserCatalog;
}

const KEYPAD = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "+"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryPanel({
  onSave,
  onAddCategory,
  onAddAccount,
  onAddSubcategory,
  noteSuggestions,
  catalog,
}: ManualEntryPanelProps) {
  const accounts = useMemo(() => getAccounts(catalog), [catalog]);
  const [type, setType] = useState<TransactionType>("expense");
  const [amountExpression, setAmountExpression] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "kaspi-gold");
  const [categoryId, setCategoryId] = useState(getDefaultCategoryIdWithCatalog("expense", catalog));
  const [subcategory, setSubcategory] = useState("");
  const [commissionExpression, setCommissionExpression] = useState("0");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const categories = useMemo(() => getCategories(type, catalog), [catalog, type]);
  const subcategories = useMemo(() => getSubcategories(type, categoryId, catalog), [catalog, type, categoryId]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryId(getDefaultCategoryIdWithCatalog(nextType, catalog));
    if (nextType !== "transfer") {
      setCommissionExpression("0");
    }
  };

  const handleAdd = () => {
    const amount = evaluateMathExpression(amountExpression);
    if (!amount || amount <= 0) {
      setFeedback("Amount must be a valid positive expression.");
      return;
    }

    const commissionRaw = type === "transfer" ? evaluateMathExpression(commissionExpression) : 0;
    if (type === "transfer" && (commissionRaw === null || commissionRaw < 0)) {
      setFeedback("Transfer commission must be set.");
      return;
    }

    const draft = {
      id: `manual-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type,
      amount: Math.round(amount),
      commission: type === "transfer" ? Math.round(commissionRaw || 0) : 0,
      availableBalance: null,
      note,
      date: date || todayIso(),
      accountId,
      categoryId,
      subcategory,
      rawText: "Manual entry",
    };

    setIsSaving(true);
    setFeedback("");
    onSave(draft)
      .then(() => {
        setAmountExpression("");
        setNote("");
        setSubcategory("");
        setFeedback("✅ Saved!");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Save failed";
        setFeedback(`❌ ${msg}`);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card md:p-7">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Manual</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Manual transaction with calculator</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate md:col-span-2">
          Amount expression
          <input
            type="text"
            value={amountExpression}
            onChange={(e) => {
              setAmountExpression(e.target.value);
              if (!date) setDate(todayIso());
            }}
            placeholder="12000+2500-300"
            className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          />
        </label>

        <div className="grid grid-cols-4 gap-2 md:col-span-2">
          {KEYPAD.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAmountExpression((prev) => prev + key)}
              className="rounded-xl border border-sand bg-cloud px-3 py-2 text-sm font-semibold text-ink transition hover:border-lavender/25"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmountExpression((prev) => prev.slice(0, -1))}
            className="rounded-xl border border-[#f3c3b7] bg-white px-3 py-2 text-sm font-semibold text-[#ad5f47]"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={() => setAmountExpression("")}
            className="col-span-3 rounded-xl border border-sand bg-white px-3 py-2 text-sm font-semibold text-slate"
          >
            Clear
          </button>
        </div>

        <label className="text-sm text-slate">
          Type
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
            className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          >
            <option value="expense">expense</option>
            <option value="income">income</option>
            <option value="transfer">transfer</option>
          </select>
        </label>

        <label className="text-sm text-slate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          />
        </label>

        <label className="text-sm text-slate">
          Account
          <InlineAddSelect
            value={accountId}
            options={accounts.map((a) => ({ id: a.id, label: a.name }))}
            onChange={(id) => setAccountId(id)}
            onAdd={(name) => onAddAccount(name, "bank_card")}
            addLabel="+ Add account…"
            addPlaceholder="Account name…"
          />
        </label>

        <label className="text-sm text-slate">
          Category
          <InlineAddSelect
            value={categoryId}
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            onChange={(id) => { setCategoryId(id); setSubcategory(""); }}
            onAdd={(name) => onAddCategory(type, name)}
            addLabel="+ Add category…"
            addPlaceholder="Category name…"
          />
        </label>

        <label className="text-sm text-slate">
          Subcategory
          <InlineAddSelect
            value={subcategory || ""}
            options={[
              { id: "", label: "No subcategory" },
              ...subcategories.map((s) => ({ id: s.name, label: s.name })),
            ]}
            onChange={(val) => setSubcategory(val)}
            onAdd={(name) => onAddSubcategory(type, categoryId, name)}
            addLabel="+ Add subcategory…"
            addPlaceholder="Subcategory name…"
          />
        </label>

        {type === "transfer" ? (
          <label className="text-sm text-slate">
            Transfer commission
            <input
              type="text"
              value={commissionExpression}
              onChange={(e) => setCommissionExpression(e.target.value)}
              placeholder="100+20"
              className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
            />
          </label>
        ) : (
          <div className="hidden md:block" />
        )}

        <label className="text-sm text-slate md:col-span-2">
          Note
          <input
            type="text"
            list="manual-note-suggestions"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional details"
            className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          />
          <datalist id="manual-note-suggestions">
            {noteSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving}
          className="rounded-full bg-lavender px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save transaction"}
        </button>
        {feedback ? <p className="text-sm text-slate">{feedback}</p> : null}
      </div>
    </section>
  );
}
