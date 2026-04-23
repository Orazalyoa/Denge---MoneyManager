import type { TransactionRepository } from "@/domain/transactions/repository";
import type { Transaction } from "@/domain/transactions/types";
import { TRANSACTIONS_STORAGE_KEY } from "@/infrastructure/storage/transactionStorageKeys";

export class LocalStorageTransactionRepository implements TransactionRepository {
  getAll(): Transaction[] {
    if (typeof window === "undefined") return [];

    const raw = window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as Transaction[];
      if (!Array.isArray(parsed)) return [];
      return parsed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    } catch {
      return [];
    }
  }

  saveMany(transactions: Transaction[]): void {
    if (typeof window === "undefined") return;

    const current = this.getAll();
    const merged = [...transactions, ...current].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(merged));
  }
}
