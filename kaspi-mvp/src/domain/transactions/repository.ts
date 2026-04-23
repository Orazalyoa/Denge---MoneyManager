import type { Transaction } from "@/domain/transactions/types";

export interface TransactionRepository {
  getAll(): Transaction[];
  saveMany(transactions: Transaction[]): void;
}
