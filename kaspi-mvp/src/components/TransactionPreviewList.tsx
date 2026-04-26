import type { DraftTransaction } from "@/domain/transactions/types";
import type { AccountKind, UserCatalog } from "@/domain/transactions/catalog";
import { TransactionItem } from "@/components/TransactionItem";

interface TransactionPreviewListProps {
  transactions: DraftTransaction[];
  catalog: UserCatalog;
  onAddCategory: (type: DraftTransaction["type"], name: string) => string | null;
  onAddAccount: (name: string, kind?: AccountKind) => string | null;
  onAddSubcategory: (type: DraftTransaction["type"], categoryId: string, name: string) => string | null;
  noteSuggestions: string[];
  onChange: (id: string, patch: Partial<DraftTransaction>) => void;
  onDelete: (id: string) => void;
  onConfirm: () => void;
}

export function TransactionPreviewList({
  transactions,
  catalog,
  onAddCategory,
  onAddAccount,
  onAddSubcategory,
  noteSuggestions,
  onChange,
  onDelete,
  onConfirm,
}: TransactionPreviewListProps) {
  if (!transactions.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-lavender/25 bg-white/70 p-6 shadow-card animate-rise md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Draft queue</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Draft transactions</h2>
        <p className="mt-2 text-sm text-slate">Queue is empty. Paste text, click Parse, review items, and then save.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card animate-rise md:p-7">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Draft queue</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Draft transactions</h2>
          <p className="mt-1 text-sm text-slate">Review each item before save: edit, delete, and confirm.</p>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-lavender px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:brightness-105"
        >
          Save transactions
        </button>
      </div>

      <div className="space-y-3">
        {transactions.map((item) => (
          <TransactionItem
            key={item.id}
            item={item}
            catalog={catalog}
            onAddCategory={onAddCategory}
            onAddAccount={onAddAccount}
            onAddSubcategory={onAddSubcategory}
            onChange={onChange}
            onDelete={onDelete}
          />
        ))}
      </div>
      <datalist id="draft-note-suggestions">
        {noteSuggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </section>
  );
}
