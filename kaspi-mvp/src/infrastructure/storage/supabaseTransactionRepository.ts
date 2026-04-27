import type { TransactionRepository } from "@/domain/transactions/repository";
import type { Transaction } from "@/domain/transactions/types";
import { markSupabaseStorageUnavailable, supabase } from "@/lib/supabase";

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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hash32(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toUuidFromString(input: string): string {
  const h1 = hash32(input, 0x811c9dc5);
  const h2 = hash32(input, 0x9e3779b1);
  const h3 = hash32(input, 0x85ebca6b);
  const h4 = hash32(input, 0xc2b2ae35);
  const hex = [h1, h2, h3, h4]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("")
    .slice(0, 32)
    .split("");

  // UUID v4 variant bits.
  hex[12] = "4";
  const variant = parseInt(hex[16], 16);
  hex[16] = ((variant & 0x3) | 0x8).toString(16);

  const normalized = hex.join("");
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}

function normalizeTransactionId(id: string): string {
  const value = id.trim().toLowerCase();
  if (UUID_REGEX.test(value)) return value;
  return toUuidFromString(value || "empty-id");
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
    id: normalizeTransactionId(tx.id),
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

    if (error) {
      markSupabaseStorageUnavailable(error);
      console.error("❌ Supabase fetch failed:", error.message, error.code, `(user=${this.userId})`);
      return [];
    }

    if (!data) return [];
    
    console.log("✅ Fetched from Supabase:", data.length, "transactions");
    return (data as SupabaseTransactionRow[]).map(toTransaction);
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    if (!supabase || transactions.length === 0) return;

    const rows = transactions.map((tx) => toRow(this.userId, tx));
    let result = await supabase.from("transactions").upsert(rows, { onConflict: "user_id,id" });

    if (result.error?.code === "42P10") {
      result = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
    }

    if (result.error) {
      markSupabaseStorageUnavailable(result.error);
      console.error(
        "❌ Supabase save failed:",
        result.error.message,
        result.error.code,
        `(${transactions.length} items, user=${this.userId})`
      );
      throw result.error;
    }

    console.log("✅ Synced to Supabase:", transactions.length, "transactions");
  }

  async deleteOne(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", this.userId)
      .eq("id", id);

    if (error) {
      markSupabaseStorageUnavailable(error);
      console.error("❌ Supabase delete failed:", error.message, error.code, `(id=${id}, user=${this.userId})`);
      throw error;
    } else {
      console.log("✅ Deleted from Supabase:", id);
    }
  }
}
