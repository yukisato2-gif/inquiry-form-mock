"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  POSTER_STATUS_LABELS,
} from "@/lib/constants";
import type { Category, Status } from "@/types";

const STATUS_DOT: Record<Status, string> = {
  RECEIVED: "bg-[#a6cc39]",
  CONFIRMED: "bg-[#f8b501]",
  ESCALATED: "bg-[#5cbeb4]",
  NOTED: "bg-[#9B9590]",
};

export default function SiteManagerPostsPage() {
  const router = useRouter();
  const posts = useAppStore((s) => s.posts);
  const currentSiteLocation = useAppStore((s) => s.currentSiteLocation);
  const setCurrentSiteLocation = useAppStore((s) => s.setCurrentSiteLocation);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 絞り込みフィルタ（UI状態のみ。Zustand/localStorageには持たない）
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");

  // 未ログイン（拠点未割当）時は管理者ログイン画面へ強制リダイレクト
  useEffect(() => {
    if (!currentSiteLocation) {
      router.replace("/admin");
    }
  }, [currentSiteLocation, router]);

  /** 選択拠点の投稿のみ（権限ガードの基底配列）。
   *  以後の候補生成・最終フィルタは必ずこの配列から派生させる。 */
  const siteOnlyPosts = useMemo(() => {
    if (!currentSiteLocation) return [];
    return posts
      .filter((p) => p.location === currentSiteLocation)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, currentSiteLocation]);

  /** 投稿月の選択肢（YYYY-MM、降順）。担当拠点の投稿からのみ生成。 */
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of siteOnlyPosts) {
      set.add(p.createdAt.slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [siteOnlyPosts]);

  /** カテゴリの選択肢。担当拠点の投稿からのみ生成。 */
  const categoryOptions = useMemo(() => {
    const set = new Set<Category>();
    for (const p of siteOnlyPosts) set.add(p.category);
    return Array.from(set);
  }, [siteOnlyPosts]);

  /** ステータスの選択肢。担当拠点の投稿からのみ生成。 */
  const statusOptions = useMemo(() => {
    const set = new Set<Status>();
    for (const p of siteOnlyPosts) set.add(p.status);
    return Array.from(set);
  }, [siteOnlyPosts]);

  /** 担当拠点フィルタ → 月 → カテゴリ → ステータス の順で絞り込み */
  const filteredPosts = useMemo(() => {
    return siteOnlyPosts.filter((p) => {
      if (filterMonth && p.createdAt.slice(0, 7) !== filterMonth) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [siteOnlyPosts, filterMonth, filterCategory, filterStatus]);

  const hasActiveFilter = !!(filterMonth || filterCategory || filterStatus);

  const resetFilters = () => {
    setFilterMonth("");
    setFilterCategory("");
    setFilterStatus("");
  };

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    return `${y}年${parseInt(m, 10)}月`;
  };

  /** 詳細表示は filteredPosts からのみ取得 = 他拠点IDをstateに入れても見えない */
  const selectedPost = useMemo(
    () => filteredPosts.find((p) => p.id === selectedId) ?? null,
    [filteredPosts, selectedId],
  );

  const logout = () => {
    setCurrentSiteLocation(null);
    setSelectedId(null);
    router.push("/admin");
  };

  if (!currentSiteLocation) {
    return null; // useEffect でリダイレクト中
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* ── ヘッダー ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] text-[#9B9590]">拠点管理者（ホーム長）</p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#2D3748]">
            担当拠点：{currentSiteLocation}
          </h1>
          <p className="mt-1 text-[13px] text-[#7A746E]">
            {hasActiveFilter
              ? `条件に一致する投稿を表示しています（${filteredPosts.length} 件）`
              : `この拠点の投稿のみ表示しています（${filteredPosts.length} 件）`}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border-[1.5px] border-border bg-white px-4 py-2 text-[13px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
        >
          ログアウト
        </button>
      </div>

      {/* ── 絞り込み ── */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border-[1.5px] border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-month" className="text-[11px] font-medium text-[#9B9590]">
            投稿月
          </label>
          <select
            id="filter-month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#2D3748] focus:border-primary-400 focus:outline-none"
          >
            <option value="">すべて</option>
            {monthOptions.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonth(ym)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-category" className="text-[11px] font-medium text-[#9B9590]">
            カテゴリ
          </label>
          <select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | "")}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#2D3748] focus:border-primary-400 focus:outline-none"
          >
            <option value="">すべて</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status" className="text-[11px] font-medium text-[#9B9590]">
            ステータス
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | "")}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#2D3748] focus:border-primary-400 focus:outline-none"
          >
            <option value="">すべて</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilter}
          className="rounded-lg border-[1.5px] border-border bg-white px-4 py-2 text-[13px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-white"
        >
          リセット
        </button>
      </div>

      {/* ── 一覧 ── */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border-[1.5px] border-border bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-[14px] text-[#9B9590]">
            {hasActiveFilter
              ? "条件に一致する投稿はありません"
              : "この拠点の投稿はまだありません"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border-[1.5px] border-border bg-white shadow-sm">
          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-border bg-[#F5F2EF] text-left text-[12px] font-bold text-[#9B9590]">
                <th className="px-4 py-3">受付番号</th>
                <th className="px-4 py-3">投稿日</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">拠点</th>
                <th className="px-4 py-3 text-right">詳細</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const isSelected = post.id === selectedId;
                return (
                  <tr
                    key={post.id}
                    className={`border-b border-border last:border-b-0 transition-colors ${
                      isSelected ? "bg-primary-50/40" : "hover:bg-[#FAF8F6]"
                    }`}
                  >
                    <td className="px-4 py-3 text-[14px] font-bold text-primary-600">
                      {post.inquiryNumber ?? post.id}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#7A746E]">
                      {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4A4540]">
                      {CATEGORY_LABELS[post.category]}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[13px] text-[#4A4540]">
                        <span
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                            STATUS_DOT[post.status]
                          }`}
                        />
                        {STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4A4540]">
                      {post.location ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(post.id)}
                        className="rounded-lg border-[1.5px] border-border px-3 py-1.5 text-[12px] font-medium text-[#6B6560] transition-colors hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700"
                      >
                        詳細を確認
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* SP用カード表示 */}
          <div className="divide-y divide-border sm:hidden">
            {filteredPosts.map((post) => (
              <div key={post.id} className="px-4 py-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-primary-600">
                    {post.inquiryNumber ?? post.id}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[#7A746E]">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        STATUS_DOT[post.status]
                      }`}
                    />
                    {STATUS_LABELS[post.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#9B9590]">
                    {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                    {` ・ ${CATEGORY_LABELS[post.category]}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedId(post.id)}
                    className="ml-3 shrink-0 text-[12px] font-medium text-primary-600 hover:text-primary-700"
                  >
                    詳細 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 詳細パネル（読み取り専用） ── */}
      {selectedPost && (
        <section className="mt-5 rounded-xl border-[1.5px] border-primary-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] text-[#9B9590]">受付番号</p>
              <p className="mt-0.5 text-[18px] font-bold text-primary-600">
                {selectedPost.inquiryNumber ?? selectedPost.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-[13px] text-[#9B9590] transition-colors hover:text-[#4A4540]"
              aria-label="詳細を閉じる"
            >
              閉じる ✕
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-3.5 text-[14px] sm:grid-cols-2">
            <div>
              <dt className="text-[12px] font-medium text-[#9B9590]">投稿日時</dt>
              <dd className="mt-0.5 text-[#4A4540]">
                {new Date(selectedPost.createdAt).toLocaleString("ja-JP")}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-medium text-[#9B9590]">カテゴリ</dt>
              <dd className="mt-0.5 text-[#4A4540]">
                {CATEGORY_LABELS[selectedPost.category]}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-medium text-[#9B9590]">緊急度</dt>
              <dd className="mt-0.5 text-[#4A4540]">
                {selectedPost.urgency
                  ? URGENCY_LABELS[selectedPost.urgency]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-medium text-[#9B9590]">ステータス</dt>
              <dd className="mt-0.5 text-[#4A4540]">
                {STATUS_LABELS[selectedPost.status]}
                <span className="ml-2 text-[11px] text-[#9B9590]">
                  （投稿者表示: {POSTER_STATUS_LABELS[selectedPost.status]}）
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[12px] font-medium text-[#9B9590]">拠点</dt>
              <dd className="mt-0.5 text-[#4A4540]">{selectedPost.location ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[12px] font-medium text-[#9B9590]">投稿内容</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-surface px-4 py-3 leading-relaxed text-[#4A4540]">
                {selectedPost.body}
              </dd>
            </div>
            {selectedPost.publicComment && (
              <div className="sm:col-span-2">
                <dt className="text-[12px] font-medium text-[#9B9590]">
                  投稿者向けコメント
                </dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg border-[1.5px] border-primary-100 bg-primary-50/40 px-4 py-3 leading-relaxed text-[#4A4540]">
                  {selectedPost.publicComment}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-[#9B9590]">
        ※この画面はモックです。本番ではログイン認証とサーバー側の権限制御が必要です。
      </p>
    </main>
  );
}
