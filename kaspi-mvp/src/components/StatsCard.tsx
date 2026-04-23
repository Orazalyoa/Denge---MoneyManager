import { formatKZT } from "@/shared/utils/formatters";

interface StatsCardProps {
  label: string;
  value: number;
  tone?: "income" | "expense" | "balance" | "neutral";
}

const toneClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  income: "bg-emerald-100 text-emerald-900 border-emerald-300",
  expense: "bg-rose-100 text-rose-900 border-rose-300",
  balance: "bg-sky-100 text-sky-900 border-sky-300",
  neutral: "bg-amber-100 text-amber-900 border-amber-300",
};

export function StatsCard({ label, value, tone = "neutral" }: StatsCardProps) {
  return (
    <article className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{formatKZT(value)}</p>
    </article>
  );
}
