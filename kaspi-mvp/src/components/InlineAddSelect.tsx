"use client";

import { useRef, useState } from "react";

export interface SelectOption {
  id: string;
  label: string;
}

interface InlineAddSelectProps {
  value: string;
  options: SelectOption[];
  /** Called when user picks an existing option. */
  onChange: (id: string) => void;
  /**
   * Called when user confirms a new name.
   * Must return the new id (or name for subcategories), or null on failure.
   */
  onAdd: (name: string) => string | null;
  /** Called when user asks to remove the currently selected value. */
  onDeleteCurrent?: (id: string) => string | null;
  canDeleteCurrent?: (id: string) => boolean;
  deleteLabel?: string;
  addLabel?: string;
  addPlaceholder?: string;
  selectClassName?: string;
}

/**
 * Drop-in replacement for a <select> that, instead of window.prompt(),
 * shows an inline text input row when the user picks "+ Add new…".
 * Works reliably on all mobile browsers.
 */
export function InlineAddSelect({
  value,
  options,
  onChange,
  onAdd,
  onDeleteCurrent,
  canDeleteCurrent,
  deleteLabel = "Delete",
  addLabel = "+ Add new…",
  addPlaceholder = "New name…",
  selectClassName,
}: InlineAddSelectProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const baseSelectClass =
    selectClassName ??
    "mt-2 w-full rounded-2xl border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10";

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__add_new__") {
      setIsAdding(true);
      setNewName("");
      // Focus the inline input after render
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    onChange(e.target.value);
  };

  const handleConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const result = onAdd(trimmed);
    if (result) {
      onChange(result);
    }
    setIsAdding(false);
    setNewName("");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewName("");
  };

  const isDeletable =
    Boolean(onDeleteCurrent) &&
    value !== "" &&
    options.some((opt) => opt.id === value) &&
    (canDeleteCurrent ? canDeleteCurrent(value) : true);

  const handleDelete = () => {
    if (!onDeleteCurrent) return;
    const nextValue = onDeleteCurrent(value);
    if (nextValue !== null) {
      onChange(nextValue);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={isAdding ? "__add_new__" : value}
        onChange={handleSelectChange}
        className={baseSelectClass}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
        <option value="__add_new__">{addLabel}</option>
      </select>

      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
              if (e.key === "Escape") handleCancel();
            }}
            placeholder={addPlaceholder}
            className="min-w-0 flex-1 rounded-2xl border border-lavender/50 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-lavender focus:ring-2 focus:ring-lavender/15"
          />
          <button
            type="button"
            onClick={handleConfirm}
            className="shrink-0 rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-white transition hover:brightness-105"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="shrink-0 rounded-full border border-sand px-3 py-2 text-xs font-medium text-slate transition hover:bg-cloud"
          >
            ✕
          </button>
        </div>
      ) : null}

      {isDeletable ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-[#f3c3b7] px-3 py-1.5 text-xs font-semibold text-[#ad5f47] transition hover:bg-[#fff1ec]"
          >
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
