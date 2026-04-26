interface AppHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export function AppHeader({ eyebrow, title, description, badge }: AppHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-card backdrop-blur md:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-lilac/80 via-[#fff7f3] to-transparent lg:block" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate md:text-base">{description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
          <div className="rounded-[20px] bg-cloud p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">Workflow</p>
            <p className="mt-2 text-sm text-ink">Paste raw Kaspi text, review each transaction, then save locally.</p>
          </div>
          <div className="rounded-[20px] border border-lavender/15 bg-gradient-to-br from-lilac via-white to-[#fff3ef] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">Trust</p>
            <p className="mt-2 text-sm text-ink">Preview-before-save stays visible, edits stay reversible, and data stays on-device.</p>
            {badge ? <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-lavender">{badge}</span> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
