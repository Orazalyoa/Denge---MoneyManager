"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ManualEntryPanel } from "@/components/ManualEntryPanel";
import { PasteBox } from "@/components/PasteBox";
import { StatsCard } from "@/components/StatsCard";
import { TransactionPreviewList } from "@/components/TransactionPreviewList";
import { useAuth } from "@/context/AuthContext";
import {
  getDraftQueueStorageKey,
  LEGACY_STORAGE_SCOPE_OWNER_KEY,
  LEGACY_DRAFT_QUEUE_STORAGE_KEY,
  normalizeStorageScope,
} from "@/infrastructure/storage/transactionStorageKeys";
import {
  getTransactions,
  loadCatalogForUser,
  parseDraftTransactions,
  saveCatalogForUser,
  saveDraftTransactions,
} from "@/application/transactions/useCases";
import {
  EMPTY_USER_CATALOG,
  getAccounts,
  getCategories,
  getSubcategories,
  loadUserCatalog,
  type AccountKind,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import { calculateStats } from "@/domain/transactions/stats";
import type { DraftTransaction, Transaction } from "@/domain/transactions/types";

function readDraftQueue(scope?: string): DraftTransaction[] {
  if (typeof window === "undefined") return [];

  const storageKey = getDraftQueueStorageKey(scope);
  const scoped = window.localStorage.getItem(storageKey);
  if (scoped) {
    return JSON.parse(scoped) as DraftTransaction[];
  }

  const legacy = window.localStorage.getItem(LEGACY_DRAFT_QUEUE_STORAGE_KEY);
  if (!legacy) return [];

  const legacyOwner = window.localStorage.getItem(LEGACY_STORAGE_SCOPE_OWNER_KEY);
  if (!scope) {
    if (legacyOwner && legacyOwner !== "guest") {
      return [];
    }

    window.localStorage.setItem(storageKey, legacy);
    return JSON.parse(legacy) as DraftTransaction[];
  }

  const normalizedScope = normalizeStorageScope(scope);
  if (legacyOwner && legacyOwner !== normalizedScope) {
    return [];
  }

  window.localStorage.setItem(storageKey, legacy);
  window.localStorage.setItem(LEGACY_STORAGE_SCOPE_OWNER_KEY, normalizedScope);
  return JSON.parse(legacy) as DraftTransaction[];
}

function claimGuestDraftQueue(scope?: string): DraftTransaction[] {
  if (typeof window === "undefined" || !scope) return [];

  const userKey = getDraftQueueStorageKey(scope);
  const guestKey = getDraftQueueStorageKey();

  try {
    const userDrafts = readDraftQueue(scope);
    const guestRaw = window.localStorage.getItem(guestKey);
    const guestDrafts = guestRaw ? (JSON.parse(guestRaw) as DraftTransaction[]) : [];

    if (guestDrafts.length === 0) {
      return userDrafts;
    }

    const merged = [...userDrafts, ...guestDrafts.filter((draft) => !userDrafts.some((item) => item.id === draft.id))];
    window.localStorage.setItem(userKey, JSON.stringify(merged));
    window.localStorage.removeItem(guestKey);
    return merged;
  } catch {
    return [];
  }
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const draftStorageKey = useMemo(() => getDraftQueueStorageKey(user?.id), [user?.id]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<DraftTransaction[]>(() => {
    try {
      return readDraftQueue();
    } catch {
      return [];
    }
  });
  const [catalog, setCatalog] = useState<UserCatalog>(() => {
    if (typeof window === "undefined") return EMPTY_USER_CATALOG;
    return loadUserCatalog();
  });
  const [savedTick, setSavedTick] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [savedTransactions, setSavedTransactions] = useState<Transaction[]>([]);
  const [isCatalogReady, setIsCatalogReady] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const previousDraftStorageKeyRef = useRef(draftStorageKey);

  const accounts = useMemo(() => getAccounts(catalog), [catalog]);

  useEffect(() => {
    void (async () => {
      const nextCatalog = await loadCatalogForUser(user?.id);
      setCatalog(nextCatalog);
      setIsCatalogReady(true);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!isCatalogReady) return;
    void saveCatalogForUser(catalog, user?.id);
  }, [catalog, user?.id, isCatalogReady]);

  useEffect(() => {
    if (isLoading) return;
    void (async () => {
      const all = await getTransactions("all", user?.id);
      setSavedTransactions(all);
    })();
  }, [savedTick, user?.id, isLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
  }, [draftStorageKey, drafts]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousKey = previousDraftStorageKeyRef.current;
    if (previousKey !== draftStorageKey) {
      window.localStorage.setItem(previousKey, JSON.stringify(drafts));
    }

    previousDraftStorageKeyRef.current = draftStorageKey;

    try {
      setDrafts(user?.id ? claimGuestDraftQueue(user.id) : readDraftQueue());
    } catch {
      setDrafts([]);
    }
  }, [draftStorageKey, user?.id]);

  const overallStats = useMemo(() => {
    const scoped =
      selectedAccountId === "all"
        ? savedTransactions
        : savedTransactions.filter((tx) => tx.accountId === selectedAccountId);
    return calculateStats(scoped);
  }, [savedTransactions, selectedAccountId]);

  const noteSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const allNotes = [...drafts.map((item) => item.note), ...savedTransactions.map((item) => item.note)];
    const normalized = allNotes
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return normalized.slice(0, 24);
  }, [drafts, savedTransactions]);

  const handleParse = () => {
    const parsed = parseDraftTransactions(input, catalog);
    setDrafts((prev) => [...prev, ...parsed]);
    setInput("");
    if (parsed.length) {
      setSaveFeedback("");
    }
  };

  const handleSave = async () => {
    if (!drafts.length || isSaving) return;

    const invalidTransfer = drafts.some((item) => item.type === "transfer" && item.commission < 0);
    if (invalidTransfer) {
      setSaveFeedback("Transfer commission cannot be negative.");
      return;
    }

    setIsSaving(true);
    try {
      console.log(`\ud83d\udcc4 Saving ${drafts.length} transactions, user=${user?.id ?? "guest"}`);
      const result = await saveDraftTransactions(drafts, user?.id, catalog);
      if (result.savedCount === 0) {
        setSaveFeedback("Nothing to save. Fill required fields in draft items.");
        return;
      }

      setDrafts([]);
      setInput("");
      setSavedTick((prev) => prev + 1);
      
      const message =
        result.storage === "cloud"
          ? `\u2705 Transactions saved to cloud and local cache (${result.savedCount} items)`
          : `\u26a0\ufe0f Saved locally only - cloud sync unavailable. Your data is safe and will sync when online. (${result.savedCount} items)`;
      
      console.log(`\ud83d\udce4 Save result: ${message}`);
      setSaveFeedback(message);
    } catch (error) {
      console.error("\u274c Save failed:", error);
      setSaveFeedback("Save failed. Please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraftChange = (id: string, patch: Partial<DraftTransaction>) => {
    setDrafts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleDelete = (id: string) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCategory = (type: DraftTransaction["type"], name: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    let createdId: string | null = null;
    setCatalog((prev) => {
      const duplicate = getCategories(type, prev).find((item) => item.name.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        createdId = duplicate.id;
        return prev;
      }

      const id = `category-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      createdId = id;
      return {
        ...prev,
        categories: [...prev.categories, { id, name: trimmedName, type }],
      };
    });

    return createdId;
  };

  const handleAddAccount = (name: string, kind: AccountKind = "bank_card"): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    let createdId: string | null = null;
    setCatalog((prev) => {
      const duplicate = getAccounts(prev).find((item) => item.name.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        createdId = duplicate.id;
        return prev;
      }

      const id = `account-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      createdId = id;
      return {
        ...prev,
        accounts: [...prev.accounts, { id, name: trimmedName, kind }],
      };
    });

    return createdId;
  };

  const handleAddSubcategory = (
    type: DraftTransaction["type"],
    categoryId: string,
    name: string,
  ): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName || !categoryId) return null;

    let createdName: string | null = null;
    setCatalog((prev) => {
      const duplicate = getSubcategories(type, categoryId, prev).find(
        (item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (duplicate) {
        createdName = duplicate.name;
        return prev;
      }

      const id = `subcategory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      createdName = trimmedName;
      return {
        ...prev,
        subcategories: [...prev.subcategories, { id, name: trimmedName, type, categoryId }],
      };
    });

    return createdName;
  };

  const handleAddManualDraft = (draft: DraftTransaction) => {
    setDrafts((prev) => [draft, ...prev]);
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-card md:p-5">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <p className="text-sm font-semibold text-ink">Account scope</p>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
          >
            <option value="all">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatsCard label="income" value={overallStats.income} tone="income" />
        <StatsCard label="expense" value={overallStats.expense} tone="expense" />
        <StatsCard label="balance" value={overallStats.balance} tone="balance" />
        <StatsCard label="transfer (with commission)" value={overallStats.transferWithCommission} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <PasteBox value={input} onChange={setInput} onParse={handleParse} isDisabled={!input.trim()} />
        <ManualEntryPanel
          onAdd={handleAddManualDraft}
          onAddCategory={handleAddCategory}
          onAddAccount={handleAddAccount}
          onAddSubcategory={handleAddSubcategory}
          noteSuggestions={noteSuggestions}
          catalog={catalog}
        />
      </section>

      <section className="grid gap-6">
        {saveFeedback ? (
          <p className="rounded-[18px] border border-sand bg-white/80 px-4 py-3 text-sm text-ink">{saveFeedback}</p>
        ) : null}
        <TransactionPreviewList
          transactions={drafts}
          catalog={catalog}
          onAddCategory={handleAddCategory}
          onAddAccount={handleAddAccount}
          onAddSubcategory={handleAddSubcategory}
          noteSuggestions={noteSuggestions}
          onChange={handleDraftChange}
          onDelete={handleDelete}
          isSaving={isSaving}
          onConfirm={() => {
            void handleSave();
          }}
        />
      </section>
    </div>
  );
}
