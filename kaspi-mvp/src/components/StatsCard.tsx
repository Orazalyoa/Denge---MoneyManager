import { formatKZT } from "@/shared/utils/formatters";

interface StatsCardProps {
  label: string;
  value: number;
  tone?: "income" | "expense" | "balance" | "neutral";
  format?: "currency" | "number";
}

const toneClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  income: "border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f1faf2_100%)] text-emerald-900",
  expense: "border-[#ffdacf] bg-[linear-gradient(180deg,#ffffff_0%,#fff3ef_100%)] text-[#9a4f39]",
  balance: "border-lavender/15 bg-[linear-gradient(180deg,#ffffff_0%,#f3f0ff_100%)] text-lavender",
  neutral: "border-sand bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fb_100%)] text-ink",
};

const accentClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  income: "bg-emerald-500",
  expense: "bg-peach",
  balance: "bg-lavender",
  neutral: "bg-slate",
};

export function StatsCard({ label, value, tone = "neutral", format = "currency" }: StatsCardProps) {
  const display = format === "number" ? String(value) : formatKZT(value);
  return (
    <article className={`rounded-[20px] border p-3 shadow-card sm:rounded-[22px] sm:p-5 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate sm:text-xs sm:tracking-[0.24em]">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accentClasses[tone]}`} />
      </div>
      <p className="mt-2 whitespace-nowrap text-lg font-bold tracking-tight sm:mt-4 sm:text-2xl md:text-[1.9rem]">{display}</p>
    </article>
  );
}
