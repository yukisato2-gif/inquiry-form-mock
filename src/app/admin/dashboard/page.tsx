"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORY_LABELS,
  CATEGORIES,
  STATUS_LABELS,
  LOCATIONS,
  DEPARTMENT_LABELS,
  CATEGORY_ASSIGNMENTS,
} from "@/lib/constants";
import StatCard from "@/components/dashboard/StatCard";
import CategoryChart from "@/components/dashboard/CategoryChart";
import TimeChart from "@/components/dashboard/TimeChart";
import LocationSection from "@/components/dashboard/LocationSection";
import AlertSection from "@/components/dashboard/AlertSection";

/** YYYY-MM 形式の月キーを生成 */
function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM → 表示用ラベル */
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}年${parseInt(m)}月`;
}

export default function DashboardPage() {
  const posts = useAppStore((s) => s.posts);
  const currentAdmin = useAppStore((s) => s.currentAdmin);
  const resetPosts = useAppStore((s) => s.resetPosts);

  // ── 月選択 ──
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedLocation, setSelectedLocation] = useState("");

  // 選択肢：データに存在する月 + 当月（重複排除、降順）
  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    keys.add(currentMonthKey);
    posts.forEach((p) => keys.add(toMonthKey(p.createdAt)));
    return Array.from(keys).sort().reverse();
  }, [posts, currentMonthKey]);

  // ── 月フィルタ済みデータ（全集計の元） ──
  const monthFiltered = useMemo(() => {
    return posts.filter((p) => toMonthKey(p.createdAt) === selectedMonth);
  }, [posts, selectedMonth]);

  // ── 拠点フィルタ ──
  const filtered = useMemo(() => {
    if (!selectedLocation) return monthFiltered;
    return monthFiltered.filter((p) => p.location === selectedLocation);
  }, [monthFiltered, selectedLocation]);

  const myDept = currentAdmin.department;

  // 自部署に関連する投稿
  const myPosts = useMemo(() => {
    return filtered.filter((p) => {
      const rule = CATEGORY_ASSIGNMENTS[p.category];
      return rule.primary === myDept || rule.related.includes(myDept);
    });
  }, [filtered, myDept]);

  const mySummary = useMemo(() => ({
    pending: myPosts.filter((p) => p.status === "RECEIVED").length,
    urgent: myPosts.filter((p) => p.urgency === "urgent" && p.status !== "NOTED").length,
    inProgress: myPosts.filter((p) => p.status === "CONFIRMED" || p.status === "ESCALATED").length,
    completed: myPosts.filter((p) => p.status === "NOTED").length,
  }), [myPosts]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const usedCategories = new Set(filtered.map((p) => p.category)).size;
    const locationsWithPosts = new Set(
      filtered.filter((p) => p.location).map((p) => p.location),
    );
    const noPostLocationCount = LOCATIONS.filter(
      (loc) => !locationsWithPosts.has(loc),
    ).length;
    const categoryData = CATEGORIES.map((c) => ({
      name: CATEGORY_LABELS[c],
      count: filtered.filter((p) => p.category === c).length,
    }));
    return { total, usedCategories, noPostLocationCount, categoryData };
  }, [filtered]);

  const recentPosts = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [filtered],
  );

  return (
    <main className="p-6">
      {/* ── ヘッダー + 月選択 ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#2D3748]">ダッシュボード</h1>
          <p className="mt-0.5 text-[13px] text-[#9B9590]">
            現場の声の傾向と対応状況を確認できます
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#9B9590]">拠点</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-[13px] text-[#4A4540] focus:border-primary-400 focus:outline-none"
            >
              <option value="">全拠点</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#9B9590]">対象月</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-[13px] text-[#4A4540] focus:border-primary-400 focus:outline-none"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>{monthLabel(key)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 担当者向けサマリー ── */}
      <div className="mb-6 rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#2D3748]">
              {currentAdmin.name}さんの対応状況
            </h2>
            <p className="mt-0.5 text-[12px] text-[#9B9590]">
              {DEPARTMENT_LABELS[myDept]} に関連する案件
            </p>
          </div>
          <Link
            href="/admin/reception"
            className="rounded-lg border-[1.5px] border-border px-4 py-2 text-[12px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
          >
            受付状況を見る →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* 未着手 */}
          <div className={`rounded-xl border-[1.5px] px-4 py-3 ${
            mySummary.pending > 0 ? "border-red-300 bg-red-50" : "border-border bg-[#FAF8F6]"
          }`}>
            <p className="text-[11px] font-medium text-[#9B9590]">未着手</p>
            <p className={`mt-1 text-[22px] font-bold ${
              mySummary.pending > 0 ? "text-red-700" : "text-[#C0BAB4]"
            }`}>
              {mySummary.pending}
            </p>
          </div>

          {/* 至急 */}
          <div className={`rounded-xl border-[1.5px] px-4 py-3 ${
            mySummary.urgent > 0 ? "border-red-400 bg-red-100" : "border-border bg-[#FAF8F6]"
          }`}>
            <p className="text-[11px] font-medium text-[#9B9590]">至急</p>
            <p className={`mt-1 text-[22px] font-bold ${
              mySummary.urgent > 0 ? "text-red-800" : "text-[#C0BAB4]"
            }`}>
              {mySummary.urgent}
            </p>
          </div>

          {/* 対応中 */}
          <div className="rounded-xl border-[1.5px] border-border bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-medium text-[#9B9590]">対応中</p>
            <p className="mt-1 text-[22px] font-bold text-gray-700">{mySummary.inProgress}</p>
          </div>

          {/* 対応完了 */}
          <div className={`rounded-xl border-[1.5px] px-4 py-3 ${
            mySummary.completed > 0 ? "border-gray-200 bg-gray-100" : "border-border bg-[#FAF8F6]"
          }`}>
            <p className="text-[11px] font-medium text-[#9B9590]">対応完了</p>
            <p className={`mt-1 text-[22px] font-bold ${
              mySummary.completed > 0 ? "text-gray-600" : "text-[#C0BAB4]"
            }`}>
              {mySummary.completed}
            </p>
          </div>
        </div>
      </div>

      {/* ── アラート ── */}
      <AlertSection posts={filtered} />

      {/* ── KPI カード (3枚) ── */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="投稿件数" value={stats.total} sub={monthLabel(selectedMonth)} />
        <StatCard
          label="カテゴリ数"
          value={`${stats.usedCategories} / ${CATEGORIES.length}`}
          sub="投稿があるカテゴリ"
        />
        <StatCard
          label="投稿なし拠点"
          value={stats.noPostLocationCount}
          accent="muted"
          sub={`全 ${LOCATIONS.length} 拠点中`}
        />
      </div>

      {/* ── グラフ行 ── */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <CategoryChart data={stats.categoryData} />
        <TimeChart posts={filtered} />
      </div>

      {/* ── 拠点セクション ── */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <LocationSection posts={filtered} />
      </div>

      {/* ── 直近の投稿 ── */}
      <div className="rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#9B9590]">
          直近の投稿
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] font-bold text-[#9B9590]">
                <th className="pb-2.5 pr-4">番号</th>
                <th className="pb-2.5 pr-4">カテゴリ</th>
                <th className="hidden pb-2.5 pr-4 sm:table-cell">拠点</th>
                <th className="pb-2.5 pr-4">ステータス</th>
                <th className="pb-2.5">投稿日</th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[13px] text-[#9B9590]">
                    この月の投稿はありません
                  </td>
                </tr>
              ) : (
                recentPosts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-b-0">
                    <td className="py-2.5 pr-4 text-[14px] font-bold text-primary-600">{p.id}</td>
                    <td className="py-2.5 pr-4 text-[13px] text-[#4A4540]">{CATEGORY_LABELS[p.category]}</td>
                    <td className="hidden py-2.5 pr-4 text-[13px] text-[#7A746E] sm:table-cell">
                      {p.location ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-[12px] text-[#7A746E]">{STATUS_LABELS[p.status]}</span>
                    </td>
                    <td className="py-2.5 text-[13px] text-[#7A746E]">
                      {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 開発者向け ── */}
      <div className="mt-12 border-t border-border pt-6">
        <p className="mb-2 text-[11px] font-medium text-[#9B9590]">モック環境管理</p>
        <p className="mb-3 text-[11px] leading-relaxed text-[#B0A9A2]">
          この画面はブラウザ保存データ（localStorage）を参照しています。
          データが表示されない場合や内容がおかしい場合は、下のボタンでサンプルデータを復元してください。
        </p>
        <button
          onClick={() => {
            const ok = confirm("現在の変更内容を破棄し、初期サンプルデータ（18件）の状態に戻します。よろしいですか？");
            if (!ok) return;
            resetPosts();
          }}
          className="rounded-md border-[1.5px] border-red-200 px-4 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
        >
          サンプルデータに戻す
        </button>
        <p className="mt-1.5 text-[10px] text-[#C0BAB4]">
          初期サンプル18件が復元されます。投稿フォームから追加したデータは消えます。
        </p>
      </div>
    </main>
  );
}
