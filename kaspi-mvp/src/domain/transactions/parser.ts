import type { DraftTransaction, TransactionType } from "@/domain/transactions/types";

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

export function splitKaspiBlocks(input: string): string[] {
  return input
    .split(SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseKaspiTransactions(input: string): DraftTransaction[] {
  const blocks = splitKaspiBlocks(input);

  return blocks
    .map((block, index) => {
      const type = detectType(block);
      const amount = extractAmount(block);

      if (!type || amount === null) {
        return null;
      }

      return {
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
        type,
        amount,
        rawText: block,
      } satisfies DraftTransaction;
    })
    .filter((item): item is DraftTransaction => item !== null);
}
