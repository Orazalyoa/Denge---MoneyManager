interface PasteBoxProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isDisabled?: boolean;
}

export function PasteBox({ value, onChange, onParse, isDisabled }: PasteBoxProps) {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card animate-rise md:p-7">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Input</p>
          <label htmlFor="kaspi-input" className="mt-2 block text-lg font-semibold text-ink">
            Вставьте текст транзакций Kaspi
          </label>
        </div>
        <span className="inline-flex rounded-full bg-lilac px-3 py-1 text-xs font-semibold text-lavender">
          Single or bulk paste
        </span>
      </div>
      <textarea
        id="kaspi-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled) onParse();
          }
        }}
        placeholder="Покупка: 36 035 ₸\nВ Магазине на Kaspi.kz\nДоступно: 44 155,51 ₸"
        className="min-h-56 w-full resize-y rounded-[22px] border border-sand bg-cloud px-4 py-4 text-sm leading-6 text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/10"
      />
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate">Поддерживаются: Покупка, Перевод, Пополнение.</p>
          <p className="mt-1 text-xs text-slate">Разделение и парсинг остаются детерминированными и локальными.</p>
        </div>
        <button
          type="button"
          onClick={onParse}
          disabled={isDisabled}
          className="rounded-full bg-lavender px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Parse
        </button>
      </div>
    </section>
  );
}
