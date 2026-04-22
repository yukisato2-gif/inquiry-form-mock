interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "default" | "warn" | "muted";
}

export default function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  const valueColor =
    accent === "warn"
      ? "text-amber-600"
      : accent === "muted"
        ? "text-slate-400"
        : "text-slate-800";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
