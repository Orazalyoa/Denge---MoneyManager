"use client";

import { useMemo, useState } from "react";
import {
  getAccounts,
  getCategories,
  saveUserCatalog,
  type AccountKind,
  type ParsingRule,
  type TransactionCategory,
  type UserCatalog,
} from "@/domain/transactions/catalog";
import type { TransactionType } from "@/domain/transactions/types";

interface ParserSettingsPanelProps {
  catalog: UserCatalog;
  onChange: (next: UserCatalog) => void;
}

function toId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function ParserSettingsPanel({ catalog, onChange }: ParserSettingsPanelProps) {
  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState<AccountKind>("bank_card");
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");

  const accounts = useMemo(() => getAccounts(catalog), [catalog]);
  const allCategories = useMemo(
    () => [
      ...getCategories("expense", catalog),
      ...getCategories("income", catalog),
      ...getCategories("transfer", catalog),
    ],
    [catalog],
  );

  const [ruleKeyword, setRuleKeyword] = useState("");
  const [ruleType, setRuleType] = useState<TransactionType | "all">("all");
  const [ruleAccountId, setRuleAccountId] = useState(accounts[0]?.id ?? "kaspi-gold");
  const [ruleCategoryId, setRuleCategoryId] = useState(allCategories[0]?.id ?? "needs");

  const applyCatalog = (next: UserCatalog) => {
    saveUserCatalog(next);
    onChange(next);
  };

  const addAccount = () => {
    const trimmed = accountName.trim();
    if (!trimmed) return;

    const next = {
      ...catalog,
      accounts: [...catalog.accounts, { id: toId("account"), name: trimmed, kind: accountKind }],
    };

    applyCatalog(next);
    setAccountName("");
  };

  const addCategory = () => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    const nextCategory: TransactionCategory = {
      id: toId("category"),
      name: trimmed,
      type: categoryType,
    };

    const next = {
      ...catalog,
      categories: [...catalog.categories, nextCategory],
    };

    applyCatalog(next);
    setCategoryName("");
  };

  const addRule = () => {
    const keyword = ruleKeyword.trim();
    if (!keyword || !ruleAccountId || !ruleCategoryId) return;

    const nextRule: ParsingRule = {
      id: toId("rule"),
      keyword,
      type: ruleType,
      accountId: ruleAccountId,
      categoryId: ruleCategoryId,
    };

    const next = {
      ...catalog,
      rules: [...catalog.rules, nextRule],
    };

    applyCatalog(next);
    setRuleKeyword("");
  };

  const deleteAccount = (id: string) => {
    const next = {
      ...catalog,
      accounts: catalog.accounts.filter((item) => item.id !== id),
      rules: catalog.rules.filter((rule) => rule.accountId !== id),
    };
    applyCatalog(next);
  };

  const deleteCategory = (id: string) => {
    const next = {
      ...catalog,
      categories: catalog.categories.filter((item) => item.id !== id),
      rules: catalog.rules.filter((rule) => rule.categoryId !== id),
    };
    applyCatalog(next);
  };

  const deleteRule = (id: string) => {
    const next = {
      ...catalog,
      rules: catalog.rules.filter((item) => item.id !== id),
    };
    applyCatalog(next);
  };

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card md:p-7">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Routing</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Custom accounts, categories, and parse rules</h2>
        <p className="mt-1 text-sm text-slate">Добавьте свои аккаунты и категории, затем настройте правило: ключевое слово - куда относить.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-[20px] bg-cloud p-4">
          <p className="text-sm font-semibold text-ink">Accounts</p>
          <div className="mt-3 grid gap-2">
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Например, Kaspi Deposit"
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            />
            <select
              value={accountKind}
              onChange={(e) => setAccountKind(e.target.value as AccountKind)}
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="bank_card">bank_card</option>
              <option value="deposit">deposit</option>
              <option value="investment">investment</option>
            </select>
            <button
              type="button"
              onClick={addAccount}
              className="rounded-full bg-lavender px-4 py-2 text-sm font-semibold text-white"
            >
              Add account
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {catalog.accounts.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                <span className="text-ink">{item.name}</span>
                <button type="button" onClick={() => deleteAccount(item.id)} className="text-[#ad5f47]">
                  delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] bg-cloud p-4">
          <p className="text-sm font-semibold text-ink">Categories</p>
          <div className="mt-3 grid gap-2">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Например, Family support"
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
              onClick={addCategory}
              className="rounded-full bg-lavender px-4 py-2 text-sm font-semibold text-white"
            >
              Add category
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {catalog.categories.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                <span className="text-ink">{item.name}</span>
                <button type="button" onClick={() => deleteCategory(item.id)} className="text-[#ad5f47]">
                  delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] bg-cloud p-4">
          <p className="text-sm font-semibold text-ink">Auto rules</p>
          <div className="mt-3 grid gap-2">
            <input
              type="text"
              value={ruleKeyword}
              onChange={(e) => setRuleKeyword(e.target.value)}
              placeholder="Ключевое слово из строки"
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            />
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as TransactionType | "all")}
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="all">all</option>
              <option value="expense">expense</option>
              <option value="income">income</option>
              <option value="transfer">transfer</option>
            </select>
            <select
              value={ruleAccountId}
              onChange={(e) => setRuleAccountId(e.target.value)}
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <select
              value={ruleCategoryId}
              onChange={(e) => setRuleCategoryId(e.target.value)}
              className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none"
            >
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.type}: {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addRule}
              className="rounded-full bg-lavender px-4 py-2 text-sm font-semibold text-white"
            >
              Add rule
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {catalog.rules.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white px-3 py-2 text-sm">
                <p className="text-ink">{item.keyword}</p>
                <p className="text-xs text-slate">{item.type}</p>
                <button type="button" onClick={() => deleteRule(item.id)} className="mt-1 text-[#ad5f47]">
                  delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
