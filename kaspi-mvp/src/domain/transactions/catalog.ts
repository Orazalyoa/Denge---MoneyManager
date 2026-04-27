import type { TransactionType } from "@/domain/transactions/types";
import {
  getUserCatalogStorageKey,
  LEGACY_STORAGE_SCOPE_OWNER_KEY,
  LEGACY_USER_CATALOG_STORAGE_KEY,
  normalizeStorageScope,
} from "@/infrastructure/storage/transactionStorageKeys";

export type AccountKind = "bank_card" | "deposit" | "investment";

export interface FinanceAccount {
  id: string;
  name: string;
  kind: AccountKind;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface TransactionSubcategory {
  id: string;
  name: string;
  type: TransactionType;
  categoryId: string;
}

export interface ParsingRule {
  id: string;
  keyword: string;
  type: TransactionType | "all";
  accountId: string;
  categoryId: string;
}

export interface UserCatalog {
  accounts: FinanceAccount[];
  categories: TransactionCategory[];
  subcategories: TransactionSubcategory[];
  rules: ParsingRule[];
}

export const DEFAULT_ACCOUNTS: FinanceAccount[] = [
  { id: "kaspi-gold", name: "Kaspi Gold Card", kind: "bank_card" },
  { id: "halyk-card", name: "Halyk Card", kind: "bank_card" },
  { id: "home-deposit", name: "Home Deposit", kind: "deposit" },
  { id: "broker-account", name: "Investment Account", kind: "investment" },
];

export const CATEGORIES_BY_TYPE: Record<TransactionType, TransactionCategory[]> = {
  expense: [
    { id: "needs", name: "Needs", type: "expense" },
    { id: "food", name: "Food", type: "expense" },
    { id: "transport", name: "Transport", type: "expense" },
    { id: "housing", name: "Housing", type: "expense" },
    { id: "health", name: "Health", type: "expense" },
  ],
  income: [
    { id: "salary", name: "Salary", type: "income" },
    { id: "freelance", name: "Freelance", type: "income" },
    { id: "gift", name: "Gift", type: "income" },
    { id: "interest", name: "Interest", type: "income" },
  ],
  transfer: [
    { id: "between-accounts", name: "Between accounts", type: "transfer" },
    { id: "bank-transfer", name: "Bank transfer", type: "transfer" },
    { id: "deposit-topup", name: "Deposit top-up", type: "transfer" },
    { id: "investment-topup", name: "Investment top-up", type: "transfer" },
  ],
};

export const EMPTY_USER_CATALOG: UserCatalog = {
  accounts: [],
  categories: [],
  subcategories: [],
  rules: [],
};

export const SUBCATEGORIES_BY_CATEGORY: Record<string, TransactionSubcategory[]> = {
  needs: [
    { id: "needs-household", name: "Household", type: "expense", categoryId: "needs" },
    { id: "needs-kids", name: "Kids", type: "expense", categoryId: "needs" },
    { id: "needs-daily", name: "Daily essentials", type: "expense", categoryId: "needs" },
  ],
  food: [
    { id: "food-grocery", name: "Grocery", type: "expense", categoryId: "food" },
    { id: "food-cafe", name: "Cafe", type: "expense", categoryId: "food" },
    { id: "food-delivery", name: "Delivery", type: "expense", categoryId: "food" },
  ],
  transport: [
    { id: "transport-taxi", name: "Taxi", type: "expense", categoryId: "transport" },
    { id: "transport-public", name: "Public transport", type: "expense", categoryId: "transport" },
    { id: "transport-fuel", name: "Fuel", type: "expense", categoryId: "transport" },
  ],
  salary: [
    { id: "salary-main", name: "Main salary", type: "income", categoryId: "salary" },
    { id: "salary-bonus", name: "Bonus", type: "income", categoryId: "salary" },
  ],
  "between-accounts": [
    { id: "between-accounts-own", name: "Own accounts", type: "transfer", categoryId: "between-accounts" },
  ],
};

function normalizeCatalog(raw: unknown): UserCatalog {
  if (!raw || typeof raw !== "object") return EMPTY_USER_CATALOG;
  const candidate = raw as Partial<UserCatalog>;

  const accounts = Array.isArray(candidate.accounts)
    ? candidate.accounts.filter(
        (item): item is FinanceAccount =>
          Boolean(item && typeof item.id === "string" && typeof item.name === "string"),
      )
    : [];

  const categories = Array.isArray(candidate.categories)
    ? candidate.categories.filter(
        (item): item is TransactionCategory =>
          Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              (item.type === "income" || item.type === "expense" || item.type === "transfer"),
          ),
      )
    : [];

  const subcategories = Array.isArray(candidate.subcategories)
    ? candidate.subcategories.filter(
        (item): item is TransactionSubcategory =>
          Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.categoryId === "string" &&
              (item.type === "income" || item.type === "expense" || item.type === "transfer"),
          ),
      )
    : [];

  const rules = Array.isArray(candidate.rules)
    ? candidate.rules.filter(
        (item): item is ParsingRule =>
          Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.keyword === "string" &&
              typeof item.accountId === "string" &&
              typeof item.categoryId === "string" &&
              (item.type === "all" || item.type === "income" || item.type === "expense" || item.type === "transfer"),
          ),
      )
    : [];

  return { accounts, categories, subcategories, rules };
}

export function loadUserCatalog(scope?: string): UserCatalog {
  if (typeof window === "undefined") return EMPTY_USER_CATALOG;
  const storageKey = getUserCatalogStorageKey(scope);
  const scoped = window.localStorage.getItem(storageKey);
  const legacy = window.localStorage.getItem(LEGACY_USER_CATALOG_STORAGE_KEY);
  const legacyOwner = window.localStorage.getItem(LEGACY_STORAGE_SCOPE_OWNER_KEY);

  let raw = scoped;
  if (!raw && legacy) {
    if (!scope) {
      if (!legacyOwner || legacyOwner === "guest") {
        raw = legacy;
      }
    } else {
      const normalizedScope = normalizeStorageScope(scope);
      if (!legacyOwner || legacyOwner === normalizedScope) {
        raw = legacy;
        window.localStorage.setItem(LEGACY_STORAGE_SCOPE_OWNER_KEY, normalizedScope);
      }
    }
  }

  if (!raw) return EMPTY_USER_CATALOG;

  try {
    const normalized = normalizeCatalog(JSON.parse(raw));
    window.localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  } catch {
    return EMPTY_USER_CATALOG;
  }
}

export function saveUserCatalog(catalog: UserCatalog, scope?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getUserCatalogStorageKey(scope), JSON.stringify(catalog));
}

export function getAccounts(catalog: UserCatalog = EMPTY_USER_CATALOG): FinanceAccount[] {
  return [...DEFAULT_ACCOUNTS, ...catalog.accounts];
}

export function getCategories(type: TransactionType, catalog: UserCatalog = EMPTY_USER_CATALOG): TransactionCategory[] {
  return [...CATEGORIES_BY_TYPE[type], ...catalog.categories.filter((item) => item.type === type)];
}

export function getSubcategories(
  type: TransactionType,
  categoryId: string,
  catalog: UserCatalog = EMPTY_USER_CATALOG,
): TransactionSubcategory[] {
  const defaults = SUBCATEGORIES_BY_CATEGORY[categoryId] ?? [];
  const custom = catalog.subcategories.filter((item) => item.type === type && item.categoryId === categoryId);
  return [...defaults, ...custom];
}

export function getDefaultCategoryId(type: TransactionType): string {
  return CATEGORIES_BY_TYPE[type][0]?.id ?? "needs";
}

export function getDefaultCategoryIdWithCatalog(type: TransactionType, catalog: UserCatalog = EMPTY_USER_CATALOG): string {
  return getCategories(type, catalog)[0]?.id ?? getDefaultCategoryId(type);
}

export function getCategoryName(type: TransactionType, categoryId: string, catalog: UserCatalog = EMPTY_USER_CATALOG): string {
  const category = getCategories(type, catalog).find((item) => item.id === categoryId);
  return category?.name ?? categoryId;
}

export function getAccountName(accountId: string, catalog: UserCatalog = EMPTY_USER_CATALOG): string {
  const account = getAccounts(catalog).find((item) => item.id === accountId);
  return account?.name ?? accountId;
}

export function matchParsingRule(
  text: string,
  type: TransactionType,
  catalog: UserCatalog = EMPTY_USER_CATALOG,
): ParsingRule | null {
  const normalizedText = text.toLowerCase();
  return (
    catalog.rules.find((rule) => {
      const keyword = rule.keyword.trim().toLowerCase();
      if (!keyword) return false;
      return (rule.type === "all" || rule.type === type) && normalizedText.includes(keyword);
    }) ?? null
  );
}
