"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadCatalogForUser, saveCatalogForUser } from "@/application/transactions/useCases";
import {
  CATEGORIES_BY_TYPE,
  DEFAULT_ACCOUNTS,
  EMPTY_USER_CATALOG,
  getAccounts,
  getCategories,
  getSubcategories,
  SUBCATEGORIES_BY_CATEGORY,
  type ParsingRule,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import type { TransactionType } from "@/domain/transactions/types";

type RuleType = TransactionType | "all";

function newId(): string {
  return `rule-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const TYPE_OPTIONS: { value: RuleType; label: string }[] = [
  { value: "all", label: "Any type" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export default function TemplatesPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<UserCatalog>(EMPTY_USER_CATALOG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Rule form state
  const [keyword, setKeyword] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("all");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Catalog manager state
  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState<"bank_card" | "deposit" | "investment">("bank_card");
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryType, setSubcategoryType] = useState<TransactionType>("expense");
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState("");

  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);

  const accounts = useMemo(() => getAccounts(catalog), [catalog]);
  const allCategories = useMemo(
    () => [...getCategories("expense", catalog), ...getCategories("income", catalog), ...getCategories("transfer", catalog)],
    [catalog],
  );

  const defaultAccountIds = useMemo(() => new Set(DEFAULT_ACCOUNTS.map((item) => item.id)), []);
  const defaultCategoryIds = useMemo(
    () =>
      new Set(
        ["expense", "income", "transfer"].flatMap((type) =>
          CATEGORIES_BY_TYPE[type as TransactionType].map((item) => item.id),
        ),
      ),
    [],
  );
  const defaultSubcategoryIds = useMemo(
    () => new Set(Object.values(SUBCATEGORIES_BY_CATEGORY).flatMap((group) => group.map((item) => item.id))),
    [],
  );

  const categories = useMemo(() => {
    if (ruleType === "all") {
      return allCategories;
    }
    return getCategories(ruleType, catalog);
  }, [allCategories, catalog, ruleType]);

  const subcategoryCategoryOptions = useMemo(() => getCategories(subcategoryType, catalog), [catalog, subcategoryType]);
  const managedSubcategories = useMemo(
    () => getSubcategories(subcategoryType, subcategoryCategoryId, catalog),
    [catalog, subcategoryCategoryId, subcategoryType],
  );

  const VISIBLE_LIMIT = 6;
  const visibleAccounts = showAllAccounts ? accounts : accounts.slice(0, VISIBLE_LIMIT);
  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, VISIBLE_LIMIT);
  const visibleSubcategories = showAllSubcategories
    ? managedSubcategories
    : managedSubcategories.slice(0, VISIBLE_LIMIT);
  const visibleRules = showAllRules ? catalog.rules : catalog.rules.slice(0, VISIBLE_LIMIT);

  useEffect(() => {
    void (async () => {
      const cat = await loadCatalogForUser(user?.id);
      setCatalog(cat);
      setIsLoaded(true);
      const allAccounts = getAccounts(cat);
      setAccountId(allAccounts[0]?.id ?? "kaspi-gold");
      const initialCategories = [
        ...getCategories("expense", cat),
        ...getCategories("income", cat),
        ...getCategories("transfer", cat),
      ];
      setCategoryId(initialCategories[0]?.id ?? "needs");
      const subTypeCategories = getCategories("expense", cat);
      setSubcategoryCategoryId(subTypeCategories[0]?.id ?? "needs");
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    const filtered = categories;
    if (filtered.length > 0 && !filtered.some((c) => c.id === categoryId)) {
      setCategoryId(filtered[0]?.id ?? "");
    }
  }, [ruleType, categories, categoryId, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    void saveCatalogForUser(catalog, user?.id);
  }, [catalog, user?.id, isLoaded]);

  useEffect(() => {
    const options = getCategories(subcategoryType, catalog);
    if (!options.some((item) => item.id === subcategoryCategoryId)) {
      setSubcategoryCategoryId(options[0]?.id ?? "");
    }
  }, [catalog, subcategoryType, subcategoryCategoryId]);

  const handleAddAccount = (): void => {
    const trimmed = accountName.trim();
    if (!trimmed) return;

    setCatalog((prev) => {
      const dup = getAccounts(prev).find((a) => a.name.toLowerCase() === trimmed.toLowerCase());
      if (dup) return prev;
      const id = `account-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      return { ...prev, accounts: [...prev.accounts, { id, name: trimmed, kind: accountKind }] };
    });
    setAccountName("");
    setFeedback("Account added.");
  };

  const handleDeleteAccount = (id: string): void => {
    if (defaultAccountIds.has(id)) return;

    setCatalog((prev) => {
      const nextAccounts = prev.accounts.filter((item) => item.id !== id);
      return {
        ...prev,
        accounts: nextAccounts,
        rules: prev.rules.filter((rule) => rule.accountId !== id),
      };
    });
    setFeedback("Account removed.");
  };

  const handleAddCategory = (): void => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    setCatalog((prev) => ({
      ...prev,
      categories: getCategories(categoryType, prev).some((item) => item.name.toLowerCase() === trimmed.toLowerCase())
        ? prev.categories
        : [...prev.categories, { id: `category-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, name: trimmed, type: categoryType }],
    }));
    setCategoryName("");
    setFeedback("Category added.");
  };

  const handleDeleteCategory = (id: string): void => {
    if (defaultCategoryIds.has(id)) return;

    setCatalog((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.id !== id),
      subcategories: prev.subcategories.filter((sub) => sub.categoryId !== id),
      rules: prev.rules.filter((rule) => rule.categoryId !== id),
    }));
    setFeedback("Category removed.");
  };

  const handleAddSubcategory = (): void => {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !subcategoryCategoryId) return;

    setCatalog((prev) => {
      const duplicate = getSubcategories(subcategoryType, subcategoryCategoryId, prev).find(
        (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) return prev;

      return {
        ...prev,
        subcategories: [
          ...prev.subcategories,
          {
            id: `subcategory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: trimmed,
            type: subcategoryType,
            categoryId: subcategoryCategoryId,
          },
        ],
      };
    });
    setSubcategoryName("");
    setFeedback("Subcategory added.");
  };

  const handleDeleteSubcategory = (id: string): void => {
    if (defaultSubcategoryIds.has(id)) return;

    setCatalog((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((item) => item.id !== id),
    }));
    setFeedback("Subcategory removed.");
  };

  const handleAdd = async () => {
    if (!keyword.trim()) {
      setFeedback("Keyword is required.");
      return;
    }
    if (!accountId || !categoryId) {
      setFeedback("Choose an account and category.");
      return;
    }

    const newRule: ParsingRule = {
      id: newId(),
      keyword: keyword.trim(),
      type: ruleType,
      accountId,
      categoryId,
    };

    const nextCatalog: UserCatalog = {
      ...catalog,
      rules: [...catalog.rules, newRule],
    };

    setIsSaving(true);
    setFeedback("");
    try {
      await saveCatalogForUser(nextCatalog, user?.id);
      setCatalog(nextCatalog);
      setKeyword("");
      setFeedback("✅ Template saved.");
    } catch {
      setFeedback("❌ Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    const nextCatalog: UserCatalog = {
      ...catalog,
      rules: catalog.rules.filter((r) => r.id !== ruleId),
    };
    setIsSaving(true);
    try {
      await saveCatalogForUser(nextCatalog, user?.id);
      setCatalog(nextCatalog);
      setFeedback("Template removed.");
    } catch {
      setFeedback("❌ Failed to delete.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-slate">Loading templates…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Mini instruction */}
      <section className="rounded-[22px] border border-lavender/20 bg-lilac p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lavender">How templates work</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Parsing templates</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          When you paste Kaspi transaction text and press <strong className="text-ink">Parse</strong>, the app checks
          each merchant/note against your templates. If the text contains the keyword, it auto-assigns the chosen
          account and category — so you don&#39;t need to edit every transaction manually in the preview.
        </p>
        <ul className="mt-3 grid gap-1.5 text-sm text-slate">
          <li>• <strong className="text-ink">Keyword</strong> — any word or phrase found in the merchant name or note (case-insensitive).</li>
          <li>• <strong className="text-ink">Type</strong> — restrict the rule to a specific transaction type, or leave as "Any type".</li>
          <li>• <strong className="text-ink">Account & Category</strong> — what gets assigned automatically on parse.</li>
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Add template form */}
        <section className="rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-card md:p-6">
          <h2 className="text-base font-semibold text-ink">Add template</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-2">
              Keyword
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Magnum, Yandex, Kolesa"
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink">
              Transaction type
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as RuleType)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink">
              Account
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
              >
                {accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-2">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.type})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={isSaving}
              className="rounded-full bg-lavender px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Add template"}
            </button>
            {feedback ? <p className="text-sm text-slate">{feedback}</p> : null}
          </div>
        </section>

        {/* Existing templates */}
        <section className="rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-card md:p-6">
          <h2 className="text-base font-semibold text-ink">
            Saved templates{" "}
            {catalog.rules.length > 0 ? (
              <span className="ml-1 rounded-full bg-lavender/10 px-2 py-0.5 text-xs font-semibold text-lavender">
                {catalog.rules.length}
              </span>
            ) : null}
          </h2>

          {catalog.rules.length === 0 ? (
            <p className="mt-4 text-sm text-slate">No templates yet. Add one to speed up transaction parsing.</p>
          ) : (
            <>
              <ul className="mt-4 grid gap-3">
                {visibleRules.map((rule) => {
                  const acc = accounts.find((a) => a.id === rule.accountId);
                  const allCats = [
                    ...getCategories("expense", catalog),
                    ...getCategories("income", catalog),
                    ...getCategories("transfer", catalog),
                  ];
                  const cat = allCats.find((c) => c.id === rule.categoryId);
                  return (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-sand bg-cloud px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          &quot;{rule.keyword}&quot;
                        </p>
                        <p className="mt-0.5 text-xs text-slate">
                          {rule.type === "all" ? "any type" : rule.type} · {acc?.name ?? rule.accountId} · {cat?.name ?? rule.categoryId}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleDelete(rule.id)}
                        className="shrink-0 rounded-full border border-[#f3c3b7] px-3 py-1.5 text-xs font-semibold text-[#ad5f47] transition hover:bg-[#fff1ec] disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
              {catalog.rules.length > VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllRules((prev) => !prev)}
                  className="mt-3 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold text-ink"
                >
                  {showAllRules ? "Show less" : "Show more"}
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>

      {/* Catalog manager */}
      <section className="rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-card md:p-6">
        <h2 className="text-base font-semibold text-ink">Dropdown catalog manager</h2>
        <p className="mt-1 text-sm text-slate">Manage all options used in dropdowns from one place.</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-sand bg-cloud/70 p-4">
            <h3 className="text-sm font-semibold text-ink">Accounts</h3>
            <div className="mt-3 grid gap-2">
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="New account name"
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              />
              <select
                value={accountKind}
                onChange={(e) => setAccountKind(e.target.value as "bank_card" | "deposit" | "investment")}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="bank_card">bank_card</option>
                <option value="deposit">deposit</option>
                <option value="investment">investment</option>
              </select>
              <button
                type="button"
                onClick={handleAddAccount}
                className="rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-white"
              >
                Add account
              </button>
            </div>
            <ul className="mt-3 grid gap-2">
              {visibleAccounts.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{item.name}</span>
                  {defaultAccountIds.has(item.id) ? (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-slate">default</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(item.id)}
                      className="rounded-full border border-[#f3c3b7] px-2.5 py-1 text-xs font-semibold text-[#ad5f47]"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {accounts.length > VISIBLE_LIMIT ? (
              <button
                type="button"
                onClick={() => setShowAllAccounts((prev) => !prev)}
                className="mt-3 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold text-ink"
              >
                {showAllAccounts ? "Show less" : "Show more"}
              </button>
            ) : null}
          </section>

          <section className="rounded-2xl border border-sand bg-cloud/70 p-4">
            <h3 className="text-sm font-semibold text-ink">Categories</h3>
            <div className="mt-3 grid gap-2">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="New category name"
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              />
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as TransactionType)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="expense">expense</option>
                <option value="income">income</option>
                <option value="transfer">transfer</option>
              </select>
              <button
                type="button"
                onClick={handleAddCategory}
                className="rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-white"
              >
                Add category
              </button>
            </div>
            <ul className="mt-3 grid gap-2">
              {visibleCategories.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{item.name} ({item.type})</span>
                  {defaultCategoryIds.has(item.id) ? (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-slate">default</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(item.id)}
                      className="rounded-full border border-[#f3c3b7] px-2.5 py-1 text-xs font-semibold text-[#ad5f47]"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {allCategories.length > VISIBLE_LIMIT ? (
              <button
                type="button"
                onClick={() => setShowAllCategories((prev) => !prev)}
                className="mt-3 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold text-ink"
              >
                {showAllCategories ? "Show less" : "Show more"}
              </button>
            ) : null}
          </section>

          <section className="rounded-2xl border border-sand bg-cloud/70 p-4">
            <h3 className="text-sm font-semibold text-ink">Subcategories</h3>
            <div className="mt-3 grid gap-2">
              <input
                type="text"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="New subcategory name"
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              />
              <select
                value={subcategoryType}
                onChange={(e) => setSubcategoryType(e.target.value as TransactionType)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="expense">expense</option>
                <option value="income">income</option>
                <option value="transfer">transfer</option>
              </select>
              <select
                value={subcategoryCategoryId}
                onChange={(e) => setSubcategoryCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
              >
                {subcategoryCategoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-white"
              >
                Add subcategory
              </button>
            </div>
            <ul className="mt-3 grid gap-2">
              {visibleSubcategories.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{item.name}</span>
                  {defaultSubcategoryIds.has(item.id) ? (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-slate">default</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubcategory(item.id)}
                      className="rounded-full border border-[#f3c3b7] px-2.5 py-1 text-xs font-semibold text-[#ad5f47]"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {managedSubcategories.length > VISIBLE_LIMIT ? (
              <button
                type="button"
                onClick={() => setShowAllSubcategories((prev) => !prev)}
                className="mt-3 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold text-ink"
              >
                {showAllSubcategories ? "Show less" : "Show more"}
              </button>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}
