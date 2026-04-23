import { parseKaspiTransactions } from "@/domain/transactions/parser";
import { calculateStats } from "@/domain/transactions/stats";
import type { DraftTransaction, Transaction, TransactionFilter } from "@/domain/transactions/types";
import { LocalStorageTransactionRepository } from "@/infrastructure/storage/localStorageTransactionRepository";

const repository = new LocalStorageTransactionRepository();

export function parseDraftTransactions(input: string): DraftTransaction[] {
  return parseKaspiTransactions(input);
}

export function saveDraftTransactions(drafts: DraftTransaction[]): void {
  const now = new Date().toISOString();

  const transactions: Transaction[] = drafts.map((draft) => ({
    id: draft.id,
    amount: draft.amount,
    type: draft.type,
    rawText: draft.rawText,
    source: "kaspi",
    createdAt: now,
  }));

  repository.saveMany(transactions);
}

export function getTransactions(filter: TransactionFilter = "all"): Transaction[] {
  const all = repository.getAll();
  if (filter === "all") return all;
  return all.filter((tx) => tx.type === filter);
}

export function getTransactionStats() {
  return calculateStats(repository.getAll());
}
