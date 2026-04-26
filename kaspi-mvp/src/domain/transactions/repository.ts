import type { Transaction } from "@/domain/transactions/types";

export interface TransactionRepository {
  getAll(): Promise<Transaction[]>;
  saveMany(transactions: Transaction[]): Promise<void>;
  deleteOne(id: string): Promise<void>;
}
