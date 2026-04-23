import type { DraftTransaction } from "@/domain/transactions/types";
import { TransactionItem } from "@/components/TransactionItem";

interface TransactionPreviewListProps {
  transactions: DraftTransaction[];
  onAmountChange: (id: string, amount: number) => void;
  onTypeChange: (id: string, type: DraftTransaction["type"]) => void;
  onDelete: (id: string) => void;
  onConfirm: () => void;
}

export function TransactionPreviewList({
  transactions,
  onAmountChange,
  onTypeChange,
  onDelete,
  onConfirm,
}: TransactionPreviewListProps) {
  if (!transactions.length) {
    return (
      <section className="rounded-xl2 border border-dashed border-ink/25 bg-white/30 p-6 text-sm text-ink/70 animate-rise">
        Пока нет распарсенных транзакций. Вставьте текст и нажмите Parse.
      </section>
    );
  }

  return (
    <section className="rounded-xl2 border border-ink/15 bg-white/70 p-5 shadow-card animate-rise">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Preview before save</h2>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          Confirm & Save
        </button>
      </div>

      <div className="space-y-3">
        {transactions.map((item) => (
          <TransactionItem
            key={item.id}
            item={item}
            onAmountChange={onAmountChange}
            onTypeChange={onTypeChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
