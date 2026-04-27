"use client";

import type { DraftTransaction } from "@/domain/transactions/types";
import {
  getAccounts,
  getCategories,
  getDefaultCategoryIdWithCatalog,
  getSubcategories,
  type AccountKind,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import { formatKZT } from "@/shared/utils/formatters";
import { InlineAddSelect } from "@/components/InlineAddSelect";

interface TransactionItemProps {
  item: DraftTransaction;
  catalog: UserCatalog;
  onAddCategory: (type: DraftTransaction["type"], name: string) => string | null;
  onAddAccount: (name: string, kind?: AccountKind) => string | null;
  onAddSubcategory: (type: DraftTransaction["type"], categoryId: string, name: string) => string | null;
  onChange: (id: string, patch: Partial<DraftTransaction>) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({
  item,
  catalog,
  onAddCategory,
  onAddAccount,
  onAddSubcategory,
  onChange,
  onDelete,
}: TransactionItemProps) {
  const categories = getCategories(item.type, catalog);
  const accounts = getAccounts(catalog);
  const subcategories = getSubcategories(item.type, item.categoryId, catalog);

  return (
    <article className="grid gap-4 rounded-[24px] border border-sand bg-cloud p-4 md:grid-cols-2 md:p-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate">
          {item.note || "Parsed block"}
        </p>
        <p className="line-clamp-3 text-sm leading-6 text-ink">{item.rawText}</p>
      </div>

      <label className="text-sm text-slate">
        Amount
        <input
          type="number"
          min={0}
          value={item.amount}
          onChange={(e) => onChange(item.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
          className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
        />
      </label>

      <label className="text-sm text-slate">
        Type
        <select
          value={item.type}
          onChange={(e) => {
            const nextType = e.target.value as DraftTransaction["type"];
            onChange(item.id, {
              type: nextType,
              categoryId: getDefaultCategoryIdWithCatalog(nextType, catalog) || item.categoryId,
              commission: nextType === "transfer" ? item.commission : 0,
            });
          }}
          className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
        >
          <option value="expense">expense</option>
          <option value="transfer">transfer</option>
          <option value="income">income</option>
        </select>
      </label>

      <label className="text-sm text-slate">
        Date
        <input
          type="date"
          value={item.date}
          onChange={(e) => onChange(item.id, { date: e.target.value })}
          className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
        />
      </label>

      <label className="text-sm text-slate">
        Account
        <InlineAddSelect
          value={item.accountId}
          options={accounts.map((a) => ({ id: a.id, label: a.name }))}
          onChange={(id) => onChange(item.id, { accountId: id })}
          onAdd={(name) => onAddAccount(name, "bank_card")}
          addLabel="+ Add account…"
          addPlaceholder="Account name…"
        />
      </label>

      <label className="text-sm text-slate">
        Category
        <InlineAddSelect
          value={item.categoryId}
          options={categories.map((c) => ({ id: c.id, label: c.name }))}
          onChange={(id) => onChange(item.id, { categoryId: id, subcategory: "" })}
          onAdd={(name) => onAddCategory(item.type, name)}
          addLabel="+ Add category…"
          addPlaceholder="Category name…"
        />
      </label>

      <label className="text-sm text-slate">
        Subcategory
        <InlineAddSelect
          value={item.subcategory || ""}
          options={[
            { id: "", label: "No subcategory" },
            ...subcategories.map((s) => ({ id: s.name, label: s.name })),
          ]}
          onChange={(val) => onChange(item.id, { subcategory: val })}
          onAdd={(name) => onAddSubcategory(item.type, item.categoryId, name)}
          addLabel="+ Add subcategory…"
          addPlaceholder="Subcategory name…"
        />
      </label>

      <label className="text-sm text-slate md:col-span-2">
        Note
        <input
          type="text"
          list="draft-note-suggestions"
          value={item.note}
          onChange={(e) => onChange(item.id, { note: e.target.value })}
          placeholder="Optional note"
          className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
        />
      </label>

      {item.type === "transfer" ? (
        <label className="text-sm text-slate">
          Transfer commission
          <input
            type="number"
            min={0}
            value={item.commission}
            onChange={(e) => onChange(item.id, { commission: Math.max(0, Number(e.target.value) || 0) })}
            className="mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          />
        </label>
      ) : null}

      <div className="flex items-center justify-between gap-2 md:justify-end md:col-span-2">
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-lavender shadow-card">{formatKZT(item.amount)}</span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-full border border-[#f3c3b7] px-3 py-1.5 text-xs font-semibold text-[#ad5f47] transition hover:bg-[#fff1ec]"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
