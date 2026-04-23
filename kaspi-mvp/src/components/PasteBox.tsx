interface PasteBoxProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isDisabled?: boolean;
}

export function PasteBox({ value, onChange, onParse, isDisabled }: PasteBoxProps) {
  return (
    <section className="rounded-xl2 border border-ink/15 bg-white/70 p-5 shadow-card animate-rise">
      <label htmlFor="kaspi-input" className="mb-2 block text-sm font-medium text-ink/85">
        Вставьте текст транзакций Kaspi
      </label>
      <textarea
        id="kaspi-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Покупка: 36 035 ₸\nВ Магазине на Kaspi.kz\nДоступно: 44 155,51 ₸"
        className="min-h-44 w-full resize-y rounded-xl border border-sand bg-cream/40 p-3 text-sm text-ink outline-none transition focus:border-clay"
      />
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-ink/70">Поддерживаются: Покупка, Перевод, Пополнение.</p>
        <button
          type="button"
          onClick={onParse}
          disabled={isDisabled}
          className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Parse
        </button>
      </div>
    </section>
  );
}
