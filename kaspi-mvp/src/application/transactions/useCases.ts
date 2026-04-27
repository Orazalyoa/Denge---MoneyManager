import { parseKaspiTransactions } from "@/domain/transactions/parser";
import { calculateStats } from "@/domain/transactions/stats";
import type { DraftTransaction, Transaction, TransactionFilter } from "@/domain/transactions/types";
import {
  EMPTY_USER_CATALOG,
  clearUserCatalog,
  getAccounts,
  getAccountName,
  getCategoryName,
  getCategories,
  loadUserCatalog,
  saveUserCatalog,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import { LocalStorageTransactionRepository } from "@/infrastructure/storage/localStorageTransactionRepository";
import { SupabaseCatalogRepository } from "@/infrastructure/storage/supabaseCatalogRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/storage/supabaseTransactionRepository";
import { isSupabaseConfigured, isSupabaseStorageEnabled } from "@/lib/supabase";

const MONEY_MANAGER_HEADER = [
  "Date",
  "Account",
  "Category",
  "Subcategory",
  "Note",
  "Amount",
  "Income/Expense",
  "Description",
].join("\t");

type MoneyManagerKind = "Income" | "Expenses" | "Transfer-Out";
export type DateRangePreset = "monthly" | "lastM" | "annually" | "lastY" | "total";
export interface DateRangeFilter {
  preset: DateRangePreset;
  value?: number;
}

export type SaveDraftResult = {
  savedCount: number;
  storage: "cloud" | "local";
};

function resolveRepository(userId?: string) {
  if (userId && isSupabaseStorageEnabled()) {
    return new SupabaseTransactionRepository(userId);
  }

  return new LocalStorageTransactionRepository(userId);
}

function mergeTransactions(...groups: Transaction[][]): Transaction[] {
  const byId = new Map<string, Transaction>();

  for (const group of groups) {
    for (const tx of group) {
      const current = byId.get(tx.id);
      if (!current || current.createdAt < tx.createdAt) {
        byId.set(tx.id, tx);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function mergeCatalogs(base: UserCatalog, incoming: UserCatalog): UserCatalog {
  return {
    accounts: [...base.accounts, ...incoming.accounts.filter((item) => !base.accounts.some((existing) => existing.id === item.id))],
    categories: [
      ...base.categories,
      ...incoming.categories.filter((item) => !base.categories.some((existing) => existing.id === item.id)),
    ],
    subcategories: [
      ...base.subcategories,
      ...incoming.subcategories.filter((item) => !base.subcategories.some((existing) => existing.id === item.id)),
    ],
    rules: [...base.rules, ...incoming.rules.filter((item) => !base.rules.some((existing) => existing.id === item.id))],
  };
}

async function getAllWithMigration(userId?: string): Promise<Transaction[]> {
  if (!userId) {
    return new LocalStorageTransactionRepository().getAll();
  }

  if (!isSupabaseStorageEnabled()) {
    return new LocalStorageTransactionRepository(userId).getAll();
  }

  console.log(`[SYNC] Syncing transactions for user=${userId}...`);

  const cloudRepository = new SupabaseTransactionRepository(userId);
  const localRepository = new LocalStorageTransactionRepository(userId);
  const guestRepository = new LocalStorageTransactionRepository();
  const localScopedSeed = await localRepository.getAll();

  const migrationKey = "kaspi_mvp_guest_migrated_v1";
  const hasMigrated = typeof window !== "undefined" && window.localStorage.getItem(migrationKey) === userId;

  let guestData: Transaction[] = [];

  if (!hasMigrated) {
    console.log("[SYNC] First login - checking for guest data to migrate...");
    guestData = await guestRepository.getAll();
    if (guestData.length > 0) {
      console.log(`[SYNC] Found ${guestData.length} guest transactions - migrating to user account`);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(migrationKey, userId);
    }
  }

  const cloudData = await cloudRepository.getAll();

  console.log(
    `[SYNC] Data sources: cloud=${cloudData.length}, local-scoped-seed=${localScopedSeed.length}, guest-migrating=${guestData.length}`
  );

  if (cloudData.length === 0 && localScopedSeed.length === 0 && guestData.length === 0) {
    console.log("[SYNC] Empty: no transactions found");
    localRepository.clear();
    return [];
  }

  const merged = mergeTransactions(cloudData, localScopedSeed, guestData);
  console.log(`[SYNC] Merged total: ${merged.length} transactions (deduplicated)`);

  const missingInCloud = merged.filter((localTx) => !cloudData.some((cloudTx) => cloudTx.id === localTx.id));
  let canClearLocalSeed = true;
  if (missingInCloud.length > 0) {
    console.log(`[SYNC] Syncing ${missingInCloud.length} missing items to cloud...`);
    try {
      await cloudRepository.saveMany(missingInCloud);
    } catch (error) {
      // Do not block reads/saves if backfill fails; keep local seed for next retry.
      canClearLocalSeed = false;
      console.warn("[SYNC] Cloud sync skipped (will retry on next load):", error);
    }
  }

  if (canClearLocalSeed) {
    localRepository.clear();
  }

  if (guestData.length > 0 && !hasMigrated) {
    await guestRepository.clear();
    console.log("[SYNC] Guest bucket cleared after migration");
  }

  return merged;
}

export function parseDraftTransactions(input: string, catalog: UserCatalog = loadUserCatalog()): DraftTransaction[] {
  return parseKaspiTransactions(input, catalog);
}

function sanitizeTsvCell(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

function toMoneyManagerDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${month}/${day}/${year}`;
}

function toIsoDateOrToday(value: string, fallback: string): string {
  const raw = value.trim();
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return raw;
  }

  return fallback;
}

function toMoneyManagerKind(type: Transaction["type"]): MoneyManagerKind {
  if (type === "income") return "Income";
  if (type === "transfer") return "Transfer-Out";
  return "Expenses";
}

function toTransactionType(kind: string): Transaction["type"] | null {
  const normalized = kind.trim().toLowerCase();
  if (normalized === "income") return "income";
  if (normalized === "expenses" || normalized === "expense") return "expense";
  if (normalized === "transfer-out" || normalized === "transfer") return "transfer";
  return null;
}

function normalizeDateRangeFilter(filter?: DateRangeFilter): Required<DateRangeFilter> {
  if (!filter) {
    return { preset: "total", value: 0 };
  }

  const safeValue = Number.isFinite(filter.value) ? Math.max(1, Math.floor(filter.value as number)) : 1;
  return { preset: filter.preset, value: safeValue };
}

function isTransactionInDateRange(isoDate: string, filter?: DateRangeFilter): boolean {
  const txDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(txDate.getTime())) return false;

  const now = new Date();
  const normalized = normalizeDateRangeFilter(filter);

  if (normalized.preset === "total") return true;

  if (normalized.preset === "monthly") {
    return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  }

  if (normalized.preset === "annually") {
    return txDate.getFullYear() === now.getFullYear();
  }

  if (normalized.preset === "lastM") {
    const start = new Date(now.getFullYear(), now.getMonth() - (normalized.value - 1), 1);
    return txDate >= start && txDate <= now;
  }

  if (normalized.preset === "lastY") {
    const startYear = now.getFullYear() - (normalized.value - 1);
    const start = new Date(startYear, 0, 1);
    return txDate >= start && txDate <= now;
  }

  return true;
}

function slugifyForId(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "unknown";
}

function ensureUniqueId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let index = 1;
  while (usedIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  const next = `${baseId}-${index}`;
  usedIds.add(next);
  return next;
}

async function toPersistedTransactions(
  drafts: DraftTransaction[],
  userId?: string,
  catalog: UserCatalog = loadUserCatalog(),
): Promise<Transaction[]> {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const existing = await getAllWithMigration(userId);
  const usedIds = new Set(existing.map((item) => item.id));

  return drafts.map((draft, index) => ({
    id: ensureUniqueId(draft.id || `tx-${Date.now()}-${index}`, usedIds),
    amount: draft.amount,
    commission: draft.type === "transfer" ? Math.max(0, draft.commission || 0) : 0,
    availableBalance: draft.availableBalance,
    type: draft.type,
    note: draft.note || "",
    date: draft.date || today,
    accountId: draft.accountId,
    accountName: getAccountName(draft.accountId, catalog),
    categoryId: draft.categoryId,
    categoryName: getCategoryName(draft.type, draft.categoryId, catalog),
    subcategory: draft.subcategory || "",
    rawText: draft.rawText || "Manual entry",
    source: "kaspi",
    createdAt: now,
  }));
}

export async function saveDraftTransactions(
  drafts: DraftTransaction[],
  userId?: string,
  catalog: UserCatalog = loadUserCatalog(),
): Promise<SaveDraftResult> {
  const validDrafts = drafts.filter(
    (draft) =>
      draft.amount > 0 &&
      Boolean(draft.accountId?.trim()) &&
      Boolean(draft.categoryId?.trim()) &&
      Boolean(draft.type),
  );
  if (!validDrafts.length) {
    return { savedCount: 0, storage: userId && isSupabaseStorageEnabled() ? "cloud" : "local" };
  }

  const transactions = await toPersistedTransactions(validDrafts, userId, catalog);
  const repository = resolveRepository(userId);
  const useCloudStorage = Boolean(userId && isSupabaseStorageEnabled());

  console.log(`[APP] Saving ${transactions.length} transactions to ${useCloudStorage ? "cloud" : "local"}`);
  await repository.saveMany(transactions);
  if (userId && isSupabaseStorageEnabled()) {
    new LocalStorageTransactionRepository(userId).clear();
  }

  return { savedCount: transactions.length, storage: useCloudStorage ? "cloud" : "local" };
}

export async function exportTransactionsToMoneyManagerTsv(
  userId?: string,
  dateRange?: DateRangeFilter,
): Promise<string> {
  const transactions = (await getAllWithMigration(userId)).filter((tx) => isTransactionInDateRange(tx.date, dateRange));
  const lines = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((tx) => {
      const description = tx.type === "transfer" && tx.commission > 0 ? `${tx.rawText} | commission: ${tx.commission}` : tx.rawText;
      return [
        toMoneyManagerDate(tx.date),
        sanitizeTsvCell(tx.accountName),
        sanitizeTsvCell(tx.categoryName),
        sanitizeTsvCell(tx.subcategory),
        sanitizeTsvCell(tx.note),
        String(Math.max(0, Math.round(tx.amount))),
        toMoneyManagerKind(tx.type),
        sanitizeTsvCell(description),
      ].join("\t");
    });

  return [MONEY_MANAGER_HEADER, ...lines].join("\n");
}

export async function importTransactionsFromMoneyManagerTsv(
  rawTsv: string,
  userId?: string,
  dateRange?: DateRangeFilter,
): Promise<{ imported: number; skipped: number }> {
  const lines = rawTsv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { imported: 0, skipped: 0 };
  }

  const rows = lines[0].toLowerCase().startsWith("date\t") ? lines.slice(1) : lines;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const catalog = await loadCatalogForUser(userId);
  const accounts = getAccounts(catalog);
  const incomeCategories = getCategories("income", catalog);
  const expenseCategories = getCategories("expense", catalog);
  const transferCategories = getCategories("transfer", catalog);
  const usedIds = new Set((await getAllWithMigration(userId)).map((item) => item.id));
  const importedAccounts = new Set<string>();
  const importedCategories = new Set<string>();
  const importedSubcategories = new Set<string>();

  let imported = 0;
  let skipped = 0;
  const importedTx: Transaction[] = [];

  for (const row of rows) {
    const cells = row.split("\t");
    const [dateRaw = "", accountRaw = "", categoryRaw = "", subcategoryRaw = "", noteRaw = "", amountRaw = "", kindRaw = "", descriptionRaw = ""] = cells;

    const accountName = accountRaw.trim();
    const categoryName = categoryRaw.trim();
    const txType = toTransactionType(kindRaw);
    const amount = Number.parseFloat(amountRaw.replace(/\s/g, "").replace(/,/g, "."));
    if (!accountName || !categoryName || !txType || !Number.isFinite(amount) || amount <= 0) {
      skipped += 1;
      continue;
    }

    const matchedAccount = accounts.find((item) => item.name.toLowerCase() === accountName.toLowerCase());
    const accountId = matchedAccount?.id ?? `import-account-${slugifyForId(accountName)}`;
    const categoryPool = txType === "income" ? incomeCategories : txType === "expense" ? expenseCategories : transferCategories;
    const matchedCategory = categoryPool.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());
    const categoryId = matchedCategory?.id ?? `import-${txType}-${slugifyForId(categoryName)}`;
    const subcategory = subcategoryRaw.trim();

    const isoDate = toIsoDateOrToday(dateRaw, today);
    if (!isTransactionInDateRange(isoDate, dateRange)) {
      skipped += 1;
      continue;
    }

    const idBase = `import-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    importedTx.push({
      id: ensureUniqueId(idBase, usedIds),
      type: txType,
      amount: Math.round(amount),
      commission: 0,
      availableBalance: null,
      note: noteRaw.trim(),
      date: isoDate,
      accountId,
      accountName,
      categoryId,
      categoryName,
      subcategory,
      rawText: descriptionRaw.trim() || "Imported from Money Manager TSV",
      source: "kaspi",
      createdAt: now,
    });

    if (!matchedAccount) {
      importedAccounts.add(`${accountId}\t${accountName}`);
    }
    if (!matchedCategory) {
      importedCategories.add(`${categoryId}\t${categoryName}\t${txType}`);
    }
    if (subcategory) {
      importedSubcategories.add(`${categoryId}\t${subcategory}\t${txType}`);
    }
    imported += 1;
  }

  if (importedTx.length) {
    const mergedCatalog: UserCatalog = {
      ...catalog,
      accounts: [
        ...catalog.accounts,
        ...Array.from(importedAccounts).map((packed) => {
          const [id, name] = packed.split("\t");
          return { id, name, kind: "bank_card" as const };
        }),
      ],
      categories: [
        ...catalog.categories,
        ...Array.from(importedCategories).map((packed) => {
          const [id, name, type] = packed.split("\t");
          return { id, name, type: type as Transaction["type"] };
        }),
      ],
      subcategories: [
        ...catalog.subcategories,
        ...Array.from(importedSubcategories).map((packed) => {
          const [categoryId, name, type] = packed.split("\t");
          return {
            id: `import-sub-${slugifyForId(categoryId)}-${slugifyForId(name)}`,
            name,
            categoryId,
            type: type as Transaction["type"],
          };
        }),
      ],
    };
    await saveCatalogForUser(mergedCatalog, userId);

    if (!userId || !isSupabaseStorageEnabled()) {
      await new LocalStorageTransactionRepository(userId).saveMany(importedTx);
    } else {
      await new SupabaseTransactionRepository(userId).saveMany(importedTx);
      new LocalStorageTransactionRepository(userId).clear();
    }
  }

  return { imported, skipped };
}

export async function deleteTransaction(id: string, userId?: string): Promise<void> {
  if (!userId) {
    await new LocalStorageTransactionRepository().deleteOne(id);
    return;
  }

  if (!isSupabaseStorageEnabled()) {
    await new LocalStorageTransactionRepository(userId).deleteOne(id);
    return;
  }

  const cloudRepository = new SupabaseTransactionRepository(userId);
  await cloudRepository.deleteOne(id);
  new LocalStorageTransactionRepository(userId).clear();
}

export async function getTransactions(filter: TransactionFilter = "all", userId?: string): Promise<Transaction[]> {
  const all = await getAllWithMigration(userId);
  if (filter === "all") return all;
  return all.filter((tx) => tx.type === filter);
}

export async function getTransactionStats(userId?: string) {
  return calculateStats(await getAllWithMigration(userId));
}

export async function syncAccountData(userId?: string): Promise<void> {
  if (!userId) return;

  await Promise.all([getAllWithMigration(userId), loadCatalogForUser(userId)]);
}

export async function loadCatalogForUser(userId?: string): Promise<UserCatalog> {
  if (!userId) return loadUserCatalog();
  if (!isSupabaseStorageEnabled()) {
    return loadUserCatalog(userId);
  }

  const cloudCatalog = await new SupabaseCatalogRepository(userId).getCatalog();
  clearUserCatalog(userId);

  const catalogMigrationKey = "kaspi_mvp_catalog_migrated_v1";
  const hasCatalogMigrated = typeof window !== "undefined" && window.localStorage.getItem(catalogMigrationKey) === userId;

  let guestCatalog = EMPTY_USER_CATALOG;
  if (!hasCatalogMigrated) {
    guestCatalog = loadUserCatalog();
    if (
      guestCatalog.accounts.length > 0 ||
      guestCatalog.categories.length > 0 ||
      guestCatalog.subcategories.length > 0 ||
      guestCatalog.rules.length > 0
    ) {
      console.log("[SYNC] First login - migrating guest catalog to user account");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(catalogMigrationKey, userId);
    }
  }

  const isCloudEmpty =
    cloudCatalog.accounts.length === 0 &&
    cloudCatalog.categories.length === 0 &&
    cloudCatalog.subcategories.length === 0 &&
    cloudCatalog.rules.length === 0;

  if (isCloudEmpty) {
    const hasGuestData =
      guestCatalog.accounts.length > 0 ||
      guestCatalog.categories.length > 0 ||
      guestCatalog.subcategories.length > 0 ||
      guestCatalog.rules.length > 0;
    if (hasGuestData) {
      await new SupabaseCatalogRepository(userId).saveCatalog(guestCatalog);
      saveUserCatalog(EMPTY_USER_CATALOG);
      console.log("[SYNC] Guest catalog cleared after migration");
      return guestCatalog;
    }

    const hasCloudData =
      cloudCatalog.accounts.length > 0 ||
      cloudCatalog.categories.length > 0 ||
      cloudCatalog.subcategories.length > 0 ||
      cloudCatalog.rules.length > 0;
    if (!hasCloudData) {
      return EMPTY_USER_CATALOG;
    }

    return cloudCatalog;
  }

  const mergedCloudCatalog = mergeCatalogs(cloudCatalog, guestCatalog);

  if (!hasCatalogMigrated && (
    guestCatalog.accounts.length > 0 ||
    guestCatalog.categories.length > 0 ||
    guestCatalog.subcategories.length > 0 ||
    guestCatalog.rules.length > 0
  )) {
    await new SupabaseCatalogRepository(userId).saveCatalog(mergedCloudCatalog);
    saveUserCatalog(EMPTY_USER_CATALOG);
    console.log("[SYNC] Guest catalog cleared after migration");
  }

  return mergedCloudCatalog;
}

export async function saveCatalogForUser(catalog: UserCatalog, userId?: string): Promise<void> {
  if (!userId || !isSupabaseStorageEnabled()) {
    saveUserCatalog(catalog, userId);
    return;
  }

  clearUserCatalog(userId);
  await new SupabaseCatalogRepository(userId).saveCatalog(catalog);
}
