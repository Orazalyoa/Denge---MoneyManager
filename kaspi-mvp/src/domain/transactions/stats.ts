import type { Transaction } from "@/domain/transactions/types";

export interface TransactionStats {
  income: number;
  expense: number;
  transfer: number;
  balance: number;
}

export function calculateStats(transactions: Transaction[]): TransactionStats {
  return transactions.reduce<TransactionStats>(
    (acc, tx) => {
      if (tx.type === "income") acc.income += tx.amount;
      if (tx.type === "expense") acc.expense += tx.amount;
      if (tx.type === "transfer") acc.transfer += tx.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    {
      income: 0,
      expense: 0,
      transfer: 0,
      balance: 0,
    },
  );
}
