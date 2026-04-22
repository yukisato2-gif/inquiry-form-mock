"use client";

import { useMemo } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Post, Category } from "@/types";

interface AlertSectionProps {
  posts: Post[];
}

interface Alert {
  message: string;
  level: "info" | "warn";
}

export default function AlertSection({ posts }: AlertSectionProps) {
  const alerts = useMemo(() => {
    const result: Alert[] = [];

    // カテゴリ別の件数を集計し、最多カテゴリが安全・事故かチェック
    const catCounts: Record<string, number> = {};
    for (const p of posts) {
      catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
    }
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat && topCat[0] === "safety" && topCat[1] >= 3) {
      result.push({
        message: `「${CATEGORY_LABELS[topCat[0] as Category]}」カテゴリの投稿が ${topCat[1]} 件あります`,
        level: "warn",
      });
    }

    // 未対応（RECEIVED）件数
    const received = posts.filter((p) => p.status === "RECEIVED").length;
    if (received >= 3) {
      result.push({
        message: `未確認の投稿が ${received} 件あります`,
        level: "info",
      });
    }

    return result.slice(0, 2);
  }, [posts]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg border px-4 py-3 text-sm ${
            alert.level === "warn"
              ? "border-amber-200 bg-amber-50/70 text-amber-700"
              : "border-primary-100 bg-primary-50/50 text-primary-700"
          }`}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
