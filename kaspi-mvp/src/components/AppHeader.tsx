import Link from "next/link";

export function AppHeader() {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-xl2 border border-ink/20 bg-cream/70 p-4 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-moss/90">Kaspi Local Tracker</p>
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">Paste. Parse. Save.</h1>
      </div>
      <nav className="flex gap-2 text-sm">
        <Link
          href="/"
          className="rounded-full border border-ink/25 px-4 py-2 text-ink transition hover:bg-ink hover:text-cream"
        >
          Main
        </Link>
        <Link
          href="/history"
          className="rounded-full border border-ink/25 px-4 py-2 text-ink transition hover:bg-ink hover:text-cream"
        >
          History
        </Link>
      </nav>
    </header>
  );
}
