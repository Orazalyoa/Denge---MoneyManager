import type { TransactionRepository } from "@/domain/transactions/repository";
import type { Transaction } from "@/domain/transactions/types";
import { TRANSACTIONS_STORAGE_KEY } from "@/infrastructure/storage/transactionStorageKeys";

export class LocalStorageTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
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

  async saveMany(transactions: Transaction[]): Promise<void> {
    if (typeof window === "undefined") return;

    const current = await this.getAll();
    const merged = [...transactions, ...current].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(merged));
  }

  async deleteOne(id: string): Promise<void> {
    if (typeof window === "undefined") return;

    const updated = (await this.getAll()).filter((tx) => tx.id !== id);
    window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
  }
}
