import type { Transaction } from "@/domain/transactions/types";

export interface TransactionStats {
  income: number;
  expense: number;
  transfer: number;
  commission: number;
  transferWithCommission: number;
  balance: number;
  profit: number;
  deficit: number;
}

export function calculateStats(transactions: Transaction[]): TransactionStats {
  const reduced = transactions.reduce<TransactionStats>(
    (acc, tx) => {
      if (tx.type === "income") acc.income += tx.amount;
      if (tx.type === "expense") acc.expense += tx.amount;
      if (tx.type === "transfer") acc.transfer += tx.amount;
      acc.commission += Math.max(0, tx.commission || 0);
      return acc;
    },
    {
      income: 0,
      expense: 0,
      transfer: 0,
      commission: 0,
      transferWithCommission: 0,
      balance: 0,
      profit: 0,
      deficit: 0,
    },
  );

  reduced.transferWithCommission = reduced.transfer + reduced.commission;

  const latestAvailable = transactions.find((tx) => typeof tx.availableBalance === "number")?.availableBalance;
  const fallbackBalance = reduced.income - reduced.expense - reduced.commission;
  reduced.balance = typeof latestAvailable === "number" ? latestAvailable : fallbackBalance;
  reduced.profit = Math.max(0, reduced.balance);
  reduced.deficit = Math.max(0, -reduced.balance);

  return reduced;
}
