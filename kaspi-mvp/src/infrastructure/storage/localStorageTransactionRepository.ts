import type { TransactionRepository } from "@/domain/transactions/repository";
import type { Transaction } from "@/domain/transactions/types";
import {
  getTransactionsStorageKey,
  LEGACY_TRANSACTIONS_STORAGE_KEY,
} from "@/infrastructure/storage/transactionStorageKeys";

export class LocalStorageTransactionRepository implements TransactionRepository {
  constructor(private readonly scope?: string) {}

  private get storageKey(): string {
    return getTransactionsStorageKey(this.scope);
  }

  private readRaw(): string | null {
    if (typeof window === "undefined") return null;

    const scoped = window.localStorage.getItem(this.storageKey);
    if (scoped) return scoped;

    if (this.scope) return null;

    const legacy = window.localStorage.getItem(LEGACY_TRANSACTIONS_STORAGE_KEY);
    if (!legacy) return null;

    window.localStorage.setItem(this.storageKey, legacy);
    return legacy;
  }

  async getAll(): Promise<Transaction[]> {
    if (typeof window === "undefined") return [];

    const raw = this.readRaw();
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
    const byId = new Map<string, Transaction>();

    for (const tx of [...transactions, ...current]) {
      const existing = byId.get(tx.id);
      if (!existing || existing.createdAt < tx.createdAt) {
        byId.set(tx.id, tx);
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    window.localStorage.setItem(this.storageKey, JSON.stringify(merged));
  }

  async deleteOne(id: string): Promise<void> {
    if (typeof window === "undefined") return;

    const updated = (await this.getAll()).filter((tx) => tx.id !== id);
    window.localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }
}
