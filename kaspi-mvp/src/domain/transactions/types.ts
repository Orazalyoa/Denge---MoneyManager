export type TransactionType = "expense" | "transfer" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  source: "kaspi";
  rawText: string;
  createdAt: string;
}

export interface DraftTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  rawText: string;
}

export type TransactionFilter = "all" | TransactionType;
