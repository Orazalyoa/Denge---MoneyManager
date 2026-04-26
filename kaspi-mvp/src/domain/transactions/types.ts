export type TransactionType = "expense" | "transfer" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  commission: number;
  availableBalance: number | null;
  note: string;
  date: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  source: "kaspi";
  rawText: string;
  createdAt: string;
}

export interface DraftTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  commission: number;
  availableBalance: number | null;
  note: string;
  date: string;
  accountId: string;
  categoryId: string;
  subcategory: string;
  rawText: string;
}

export type TransactionFilter = "all" | TransactionType;
