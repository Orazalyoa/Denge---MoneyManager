import type { DraftTransaction, TransactionType } from "@/domain/transactions/types";
import {
  EMPTY_USER_CATALOG,
  getAccounts,
  getCategories,
  getDefaultCategoryIdWithCatalog,
  matchParsingRule,
  type UserCatalog,
} from "@/domain/transactions/catalog";

const SPLIT_REGEX = /(?=Покупка:|Перевод:|Пополнение:)/g;

function detectType(block: string): TransactionType | null {
  if (block.includes("Покупка")) return "expense";
  if (block.includes("Перевод")) return "transfer";
  if (block.includes("Пополнение")) return "income";
  return null;
}

function extractAmount(block: string): number | null {
  const amountWithCurrency = block.match(/(\d[\d\s]*)(?=\s*₸)/);
  const fallback = block.match(/\d[\d\s]*/);
  const rawAmount = amountWithCurrency?.[1] ?? fallback?.[0];

  if (!rawAmount) return null;

  const parsed = Number.parseInt(rawAmount.replace(/\s/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAvailableBalance(block: string): number | null {
  const match = block.match(/Доступно:\s*([\d\s]+(?:,\d+)?)/i);
  if (!match?.[1]) return null;
  const normalized = match[1].replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Extracts the merchant/description line from a block.
 * Kaspi format: first line is "Тип: сумма ₸", second line is the merchant.
 * Lines starting with "Доступно" are ignored.
 */
function extractNote(block: string): string {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Skip the first line (e.g. "Покупка: 36 035 ₸") and "Доступно" lines
  const noteLine = lines.find(
    (line, i) => i > 0 && !line.startsWith("Доступно"),
  );
  return noteLine ?? "";
}

export function splitKaspiBlocks(input: string): string[] {
  return input
    .split(SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseKaspiTransactions(input: string, catalog: UserCatalog = EMPTY_USER_CATALOG): DraftTransaction[] {
  const blocks = splitKaspiBlocks(input);
  const today = new Date().toISOString().slice(0, 10);
  const accounts = getAccounts(catalog);
  const fallbackAccountId = accounts[0]?.id ?? "kaspi-gold";

  return blocks
    .map((block, index) => {
      const type = detectType(block);
      const amount = extractAmount(block);

      if (!type || amount === null) {
        return null;
      }

      const note = extractNote(block);
      const rule = matchParsingRule(`${note}\n${block}`, type, catalog);
      const ruleAccountExists = Boolean(rule?.accountId && accounts.some((account) => account.id === rule.accountId));
      const ruleCategoryExists = Boolean(
        rule?.categoryId && getCategories(type, catalog).some((category) => category.id === rule.categoryId),
      );

      return {
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
        type,
        amount,
        commission: 0,
        availableBalance: extractAvailableBalance(block),
        note,
        date: today,
        accountId: ruleAccountExists ? rule!.accountId : fallbackAccountId,
        categoryId: ruleCategoryExists ? rule!.categoryId : getDefaultCategoryIdWithCatalog(type, catalog),
        subcategory: "",
        rawText: block,
      } satisfies DraftTransaction;
    })
    .filter((item): item is DraftTransaction => item !== null);
}
