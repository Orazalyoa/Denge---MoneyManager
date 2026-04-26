import { parseKaspiTransactions } from "@/domain/transactions/parser";
import { calculateStats } from "@/domain/transactions/stats";
import type { DraftTransaction, Transaction, TransactionFilter } from "@/domain/transactions/types";
import {
  EMPTY_USER_CATALOG,
  getAccountName,
  getCategoryName,
  loadUserCatalog,
  saveUserCatalog,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import { LocalStorageTransactionRepository } from "@/infrastructure/storage/localStorageTransactionRepository";
import { SupabaseCatalogRepository } from "@/infrastructure/storage/supabaseCatalogRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/storage/supabaseTransactionRepository";

function resolveRepository(userId?: string) {
  return userId ? new SupabaseTransactionRepository(userId) : new LocalStorageTransactionRepository();
}

async function getAllWithMigration(userId?: string): Promise<Transaction[]> {
  if (!userId) {
    return new LocalStorageTransactionRepository().getAll();
  }

  const cloudRepository = new SupabaseTransactionRepository(userId);
  const cloudData = await cloudRepository.getAll();
  if (cloudData.length > 0) return cloudData;

  const localData = await new LocalStorageTransactionRepository().getAll();
  if (localData.length > 0) {
    await cloudRepository.saveMany(localData);
    return localData;
  }

  return [];
}

export function parseDraftTransactions(input: string, catalog: UserCatalog = loadUserCatalog()): DraftTransaction[] {
  return parseKaspiTransactions(input, catalog);
}

export async function saveDraftTransactions(drafts: DraftTransaction[], userId?: string): Promise<void> {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const userCatalog = loadUserCatalog();

  const transactions: Transaction[] = drafts.map((draft) => ({
    id: draft.id,
    amount: draft.amount,
    commission: draft.type === "transfer" ? Math.max(0, draft.commission || 0) : 0,
    availableBalance: draft.availableBalance,
    type: draft.type,
    note: draft.note,
    date: draft.date || today,
    accountId: draft.accountId,
    accountName: getAccountName(draft.accountId, userCatalog),
    categoryId: draft.categoryId,
    categoryName: getCategoryName(draft.type, draft.categoryId, userCatalog),
    subcategory: draft.subcategory,
    rawText: draft.rawText,
    source: "kaspi",
    createdAt: now,
  }));

  const repository = resolveRepository(userId);
  await repository.saveMany(transactions);
}

export async function deleteTransaction(id: string, userId?: string): Promise<void> {
  const repository = resolveRepository(userId);
  await repository.deleteOne(id);
}

export async function getTransactions(filter: TransactionFilter = "all", userId?: string): Promise<Transaction[]> {
  const all = await getAllWithMigration(userId);
  if (filter === "all") return all;
  return all.filter((tx) => tx.type === filter);
}

export async function getTransactionStats(userId?: string) {
  const repository = resolveRepository(userId);
  return calculateStats(await repository.getAll());
}

export async function loadCatalogForUser(userId?: string): Promise<UserCatalog> {
  if (!userId) return loadUserCatalog();

  const cloudCatalog = await new SupabaseCatalogRepository(userId).getCatalog();
  const isCloudEmpty =
    cloudCatalog.accounts.length === 0 &&
    cloudCatalog.categories.length === 0 &&
    cloudCatalog.subcategories.length === 0 &&
    cloudCatalog.rules.length === 0;

  if (isCloudEmpty) {
    const localCatalog = loadUserCatalog();
    const hasLocalData =
      localCatalog.accounts.length > 0 ||
      localCatalog.categories.length > 0 ||
      localCatalog.subcategories.length > 0 ||
      localCatalog.rules.length > 0;
    if (hasLocalData) {
      await new SupabaseCatalogRepository(userId).saveCatalog(localCatalog);
      return localCatalog;
    }

    return EMPTY_USER_CATALOG;
  }

  saveUserCatalog(cloudCatalog);
  return cloudCatalog;
}

export async function saveCatalogForUser(catalog: UserCatalog, userId?: string): Promise<void> {
  saveUserCatalog(catalog);
  if (!userId) return;
  await new SupabaseCatalogRepository(userId).saveCatalog(catalog);
}
