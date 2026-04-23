import type { DraftTransaction } from "@/domain/transactions/types";
import { formatKZT } from "@/shared/utils/formatters";

interface TransactionItemProps {
  item: DraftTransaction;
  onAmountChange: (id: string, amount: number) => void;
  onTypeChange: (id: string, type: DraftTransaction["type"]) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({ item, onAmountChange, onTypeChange, onDelete }: TransactionItemProps) {
  return (
    <article className="grid gap-3 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-[1fr_150px_140px_auto] md:items-center">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-ink/60">Raw block</p>
        <p className="line-clamp-2 text-sm text-ink">{item.rawText}</p>
      </div>

      <label className="text-sm text-ink/80">
        Amount
        <input
          type="number"
          min={0}
          value={item.amount}
          onChange={(e) => onAmountChange(item.id, Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-sand bg-cream/40 p-2 text-sm"
        />
      </label>

      <label className="text-sm text-ink/80">
        Type
        <select
          value={item.type}
          onChange={(e) => onTypeChange(item.id, e.target.value as DraftTransaction["type"])}
          className="mt-1 w-full rounded-lg border border-sand bg-cream/40 p-2 text-sm"
        >
          <option value="expense">expense</option>
          <option value="transfer">transfer</option>
          <option value="income">income</option>
        </select>
      </label>

      <div className="flex items-center justify-between gap-2 md:justify-end">
        <span className="rounded-full bg-clay/15 px-3 py-1 text-xs font-medium text-ink">{formatKZT(item.amount)}</span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-700 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
