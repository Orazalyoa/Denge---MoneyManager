import type { TransactionRepository } from "@/domain/transactions/repository";
import type { Transaction } from "@/domain/transactions/types";
import { supabase } from "@/lib/supabase";

interface SupabaseTransactionRow {
  id: string;
  user_id: string;
  type: Transaction["type"];
  amount: number;
  commission: number;
  available_balance: number | null;
  note: string;
  date: string;
  account_id: string;
  account_name: string;
  category_id: string;
  category_name: string;
  subcategory: string;
  source: "kaspi";
  raw_text: string;
  created_at: string;
}

function toTransaction(row: SupabaseTransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    commission: row.commission,
    availableBalance: row.available_balance,
    note: row.note,
    date: row.date,
    accountId: row.account_id,
    accountName: row.account_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    subcategory: row.subcategory,
    source: row.source,
    rawText: row.raw_text,
    createdAt: row.created_at,
  };
}

function toRow(userId: string, tx: Transaction): SupabaseTransactionRow {
  return {
    id: tx.id,
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    commission: tx.commission,
    available_balance: tx.availableBalance,
    note: tx.note,
    date: tx.date,
    account_id: tx.accountId,
    account_name: tx.accountName,
    category_id: tx.categoryId,
    category_name: tx.categoryName,
    subcategory: tx.subcategory,
    source: tx.source,
    raw_text: tx.rawText,
    created_at: tx.createdAt,
  };
}

export class SupabaseTransactionRepository implements TransactionRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<Transaction[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Failed to fetch transactions from Supabase", error);
      return [];
    }

    return (data as SupabaseTransactionRow[]).map(toTransaction);
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    if (!supabase || transactions.length === 0) return;

    const rows = transactions.map((tx) => toRow(this.userId, tx));
    const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("Failed to save transactions to Supabase", error);
      throw error;
    }
  }

  async deleteOne(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", this.userId)
      .eq("id", id);

    if (error) {
      console.error("Failed to delete transaction from Supabase", error);
      throw error;
    }
  }
}
