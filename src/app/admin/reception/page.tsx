"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  LOCATIONS,
  CATEGORIES,
  DEPARTMENT_LABELS,
  CATEGORY_ASSIGNMENTS,
  MOCK_ADMIN_USERS,
  ADMIN_ROLE_LABELS,
  FLOW_STAGE_LABELS,
  EXPECTED_ACTION_LABELS,
} from "@/lib/constants";
import DetailPanel from "@/components/reception/DetailPanel";
import { calcSla } from "@/lib/sla";
import type { Status, Category, Urgency, FlowStage, ExpectedAction } from "@/types";

const EXPECTED_SHORT: Record<ExpectedAction, string> = {
  inform: "情報共有",
  area_improve: "エリア対応",
  hq_check: "本社確認",
  unsure: "要判断",
};

const SLA_BADGE: Record<string, string> = {
  ok: "text-[#9B9590]",
  warning: "text-amber-600",
  overdue: "text-red-600 font-bold",
};

const STATUS_BADGE_COLORS: Record<Status, string> = {
  RECEIVED: "bg-[#F0EDEA] text-[#6B6560]",
  CONFIRMED: "bg-primary-50 text-primary-600",
  ESCALATED: "bg-amber-50 text-amber-700",
  NOTED: "bg-[#F5F2EF] text-[#9B9590]",
};

const URGENCY_BADGE: Record<Urgency, string> = {
  urgent: "bg-red-50 text-red-600",
  normal: "bg-[#F5F2EF] text-[#9B9590]",
  proposal: "bg-gray-100 text-gray-700",
};

type ViewFilter = "all" | "mine" | "unconfirmed" | "urgent" | "in_progress";

export default function ReceptionPage() {
  const posts = useAppStore((s) => s.posts);
  const currentAdmin = useAppStore((s) => s.currentAdmin);
  const setCurrentAdmin = useAppStore((s) => s.setCurrentAdmin);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterMy, setFilterMy] = useState(false);
  const [filterPending, setFilterPending] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const myDept = currentAdmin.department;

  const isMyDeptPost = (p: { category: Category }) => {
    const rule = CATEGORY_ASSIGNMENTS[p.category];
    return rule.primary === myDept || rule.related.includes(myDept);
  };

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      // タブフィルタ
      if (viewFilter === "mine" && !isMyDeptPost(p)) return false;
      if (viewFilter === "unconfirmed" && p.status !== "RECEIVED") return false;
      if (viewFilter === "urgent" && p.urgency !== "urgent") return false;
      if (viewFilter === "in_progress" && p.status !== "CONFIRMED" && p.status !== "ESCALATED") return false;

      // 既存ドロップダウン
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterLocation && p.location !== filterLocation) return false;
      if (filterUser && p.assignedUser !== filterUser) return false;

      // クイックフィルタ: 自分の対応待ち
      if (filterMy) {
        const isMyAssigned = p.assignedUser === currentAdmin.name;
        const isMyDeptReceipt = p.status === "RECEIVED" && myDept === "healthcare";
        const isMyDeptPending = p.assignedDept === myDept && p.status !== "NOTED" && p.flowStage !== "reported";
        if (!isMyAssigned && !isMyDeptReceipt && !isMyDeptPending) return false;
      }
      if (filterPending && p.status !== "RECEIVED") return false;
      if (filterOverdue) {
        const slaCheck = calcSla(p);
        const isComp = p.status === "NOTED" || p.flowStage === "reported";
        if (isComp || slaCheck.status !== "overdue") return false;
      }

      // テキスト検索
      if (searchText) {
        const q = searchText.toLowerCase();
        const haystack = `${p.id} ${p.body} ${p.location ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [posts, viewFilter, filterCategory, filterLocation, filterUser, filterMy, filterPending, filterOverdue, searchText, myDept, currentAdmin.name]);

  // フィルタ変更時にページを1に戻す
  useEffect(() => { setCurrentPage(1); }, [viewFilter, filterCategory, filterLocation, filterUser, filterMy, filterPending, filterOverdue, searchText, pageSize]);

  // ページング計算
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) setCurrentPage(safePage);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalFiltered);
  const paged = useMemo(() => filtered.slice(startIdx, endIdx), [filtered, startIdx, endIdx]);

  const selectedPost = selectedId ? posts.find((p) => p.id === selectedId) : null;

  const counts = useMemo(() => ({
    all: posts.length,
    mine: posts.filter((p) => isMyDeptPost(p)).length,
    unconfirmed: posts.filter((p) => p.status === "RECEIVED").length,
    urgent: posts.filter((p) => p.urgency === "urgent").length,
    in_progress: posts.filter((p) => p.status === "CONFIRMED" || p.status === "ESCALATED").length,
  }), [posts, myDept]);

  // 自部署の未確認
  const myUnconfirmed = useMemo(
    () => posts.filter((p) => isMyDeptPost(p) && p.status === "RECEIVED").length,
    [posts, myDept],
  );

  // 担当者のユニークリスト
  const assignedUsers = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((p) => { if (p.assignedUser) names.add(p.assignedUser); });
    return Array.from(names).sort();
  }, [posts]);

  const hasQuickFilter = filterMy || filterPending || filterOverdue || filterUser || searchText;
  const resetAll = () => {
    setFilterCategory(""); setFilterLocation(""); setFilterUser("");
    setFilterMy(false); setFilterPending(false); setFilterOverdue(false);
    setSearchText(""); setViewFilter("all");
  };

  const VIEW_TABS: { key: ViewFilter; label: string }[] = [
    { key: "all", label: "全件" },
    { key: "mine", label: "自部署" },
    { key: "unconfirmed", label: "未確認" },
    { key: "urgent", label: "至急" },
    { key: "in_progress", label: "対応中" },
  ];

  return (
    <div className="flex h-full">
      <main className={`flex-1 overflow-y-auto p-6 ${selectedPost ? "hidden lg:block" : ""}`}>
        {/* ヘッダー */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-[#2D3748]">受付状況</h1>
          <p className="mt-0.5 text-[13px] text-[#9B9590]">
            投稿を確認し、対応ステータスを更新してください
          </p>
        </div>

        {/* 未対応アラート */}
        {myUnconfirmed > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border-[1.5px] border-primary-200 bg-primary-50 px-4 py-3">
            <p className="text-[13px] text-primary-700">
              あなたの部署に <span className="font-bold">{myUnconfirmed}件</span> の未確認案件があります
            </p>
            <button
              onClick={() => setViewFilter("mine")}
              className="text-[12px] font-medium text-primary-600 hover:text-primary-700"
            >
              自部署を表示 →
            </button>
          </div>
        )}

        {/* タブ */}
        <div className="mb-4 flex gap-0.5 border-b border-border">
          {VIEW_TABS.map((tab) => {
            const active = viewFilter === tab.key;
            const count = counts[tab.key];
            const isUrgentTab = tab.key === "urgent" && count > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setViewFilter(tab.key)}
                className={`relative px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "font-medium text-primary-700"
                    : "text-[#9B9590] hover:text-[#4A4540]"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${
                  active ? "text-primary-500"
                    : isUrgentTab ? "text-red-500"
                    : "text-[#C0BAB4]"
                }`}>
                  {count}
                </span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* フィルター */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | "")}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-sm text-[#4A4540] focus:border-primary-400 focus:outline-none"
          >
            <option value="">カテゴリ: すべて</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-sm text-[#4A4540] focus:border-primary-400 focus:outline-none"
          >
            <option value="">拠点: すべて</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* 担当者フィルタ */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-sm text-[#4A4540] focus:border-primary-400 focus:outline-none"
          >
            <option value="">担当者: すべて</option>
            {assignedUsers.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* クイックフィルタ */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {([
            { state: filterMy, set: setFilterMy, label: "自分の対応待ち" },
            { state: filterPending, set: setFilterPending, label: "未対応のみ" },
            { state: filterOverdue, set: setFilterOverdue, label: "期限超過のみ" },
          ] as const).map(({ state, set: setFn, label }) => (
            <button
              key={label}
              onClick={() => setFn(!state)}
              className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                state
                  ? "border-primary-200 bg-primary-50 text-primary-600"
                  : "border-border bg-white text-[#9B9590] hover:border-[#C0BAB4] hover:text-[#6B6560]"
              }`}
            >
              {label}
            </button>
          ))}

          {hasQuickFilter && (
            <button
              onClick={resetAll}
              className="px-3 py-1.5 text-[11px] text-[#9B9590] hover:text-[#4A4540]"
            >
              すべて解除
            </button>
          )}

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ml-auto px-3 py-1.5 text-[11px] text-[#9B9590] hover:text-[#4A4540]"
          >
            {showAdvanced ? "− 詳細検索" : "＋ 詳細検索"}
          </button>
        </div>

        {/* 詳細検索 */}
        {showAdvanced && (
          <div className="mb-3 rounded-lg border-[1.5px] border-border bg-white px-4 py-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="投稿ID・本文をキーワード検索"
              className="w-full rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#4A4540] placeholder:text-[#C0BAB4] focus:border-primary-400 focus:outline-none"
            />
          </div>
        )}

        {/* 絞り込み状態 + 件数 */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
          {(filterMy || filterPending || filterOverdue || filterUser || filterCategory || filterLocation || searchText) && (
            <>
              <span className="text-[#9B9590]">絞り込み中：</span>
              {filterMy && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-600">自分の対応待ち</span>}
              {filterPending && <span className="rounded bg-yellow-50 px-1.5 py-0.5 text-yellow-700">未対応</span>}
              {filterOverdue && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">期限超過</span>}
              {filterUser && <span className="rounded bg-[#F5F2EF] px-1.5 py-0.5 text-[#6B6560]">{filterUser}</span>}
              {filterCategory && <span className="rounded bg-[#F5F2EF] px-1.5 py-0.5 text-[#6B6560]">{CATEGORY_LABELS[filterCategory]}</span>}
              {filterLocation && <span className="rounded bg-[#F5F2EF] px-1.5 py-0.5 text-[#6B6560]">{filterLocation}</span>}
              {searchText && <span className="rounded bg-[#F5F2EF] px-1.5 py-0.5 text-[#6B6560]">「{searchText}」</span>}
            </>
          )}
          <span className="ml-auto flex items-center gap-2 text-[#9B9590]">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-border bg-white px-1.5 py-0.5 text-[11px] text-[#4A4540] focus:outline-none"
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}件</option>
              ))}
            </select>
            <span>
              {totalFiltered}件中 <span className="font-bold text-[#4A4540]">{totalFiltered === 0 ? "0-0" : `${startIdx + 1}-${endIdx}`}</span>件表示
            </span>
          </span>
        </div>

        {/* テーブル */}
        <div className="rounded-xl border-[1.5px] border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F5F2EF] text-left text-[12px] font-bold text-[#9B9590]">
                <th className="w-5 px-0 py-3" />
                <th className="px-3 py-3">番号</th>
                <th className="px-3 py-3">ステータス</th>
                <th className="px-3 py-3">期限</th>
                <th className="hidden px-3 py-3 lg:table-cell">緊急度</th>
                <th className="hidden px-3 py-3 lg:table-cell">主担当</th>
                <th className="px-3 py-3">カテゴリ</th>
                <th className="hidden px-3 py-3 xl:table-cell">拠点</th>
                <th className="hidden px-3 py-3 lg:table-cell">投稿日</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((post) => {
                const isSelected = selectedId === post.id;
                const deptKey = post.assignedDept ?? CATEGORY_ASSIGNMENTS[post.category].primary;
                const isUrgent = post.urgency === "urgent";
                const isUnconfirmed = post.status === "RECEIVED";
                const isMine = isMyDeptPost(post);
                const sla = calcSla(post);
                const isCompleted = post.status === "NOTED" || post.flowStage === "reported";

                // 優先度判定
                const isOverdue = sla.status === "overdue" && !isCompleted;
                const isUrgentUnconfirmed = isUrgent && isUnconfirmed;
                const isEscalatedStale = post.status === "ESCALATED" && !post.assignedUser;

                // 行背景（基本統一、選択時のみ色変更）
                const rowBg = isSelected
                  ? "bg-primary-50/60"
                  : "hover:bg-[#FAF8F6]";

                // 左ライン色
                const lineColor = isOverdue
                  ? "bg-red-500"
                  : isUrgentUnconfirmed
                    ? "bg-amber-400"
                    : isUnconfirmed
                      ? "bg-yellow-400"
                      : isEscalatedStale
                        ? "bg-amber-300"
                        : null;

                return (
                  <tr
                    key={post.id}
                    onClick={() => setSelectedId(post.id)}
                    className={`cursor-pointer border-b border-border last:border-b-0 transition-colors ${rowBg}`}
                  >
                    {/* 優先度ライン */}
                    <td className="w-5 px-0 py-3">
                      {lineColor && (
                        <span className={`ml-1 inline-block w-[3px] rounded-full ${lineColor}`} style={{ minHeight: 20 }} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-[14px] font-bold text-primary-600">
                      {post.id}
                    </td>
                    <td className="px-3 py-3">
                      {(() => {
                        const label = isCompleted ? "対応完了" : isUnconfirmed ? "未着手" : "対応中";
                        const chipColor = isCompleted
                          ? "bg-gray-100 text-gray-400"
                          : isUnconfirmed
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-600";
                        // バトン待ち補助テキスト
                        const waitingFor = isUnconfirmed
                          ? "一次受信待ち"
                          : (!isCompleted && post.assignedDept && post.flowStage === "policy" && !post.responsePolicy)
                            ? `${DEPARTMENT_LABELS[post.assignedDept]}対応待ち`
                            : null;
                        return (
                          <div>
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium ${chipColor}`}>
                              {label}
                            </span>
                            {waitingFor && (
                              <span className="mt-0.5 block text-[9px] text-[#9B9590]">{waitingFor}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3">
                      {isCompleted ? (
                        <span className="text-[12px] text-[#C0BAB4]">—</span>
                      ) : (
                        <div>
                          <span className={`block text-[12px] ${SLA_BADGE[sla.status]}`}>
                            {sla.label}
                          </span>
                          <span className="block text-[10px] text-[#9B9590]">
                            {(() => {
                              const base = new Date(post.updatedAt);
                              const deadline = new Date(base.getTime() + sla.limit * 86400000);
                              const m = deadline.getMonth() + 1;
                              const d = deadline.getDate();
                              return sla.status === "overdue"
                                ? `${deadline.getFullYear()}/${m}/${d}期限`
                                : `${deadline.getFullYear()}/${m}/${d}`;
                            })()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      {post.urgency ? (
                        <span className={`inline-block rounded px-2 py-0.5 text-[12px] font-medium ${URGENCY_BADGE[post.urgency]}`}>
                          {URGENCY_LABELS[post.urgency]}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#C0BAB4]">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-[12px] text-[#7A746E] lg:table-cell">
                      {DEPARTMENT_LABELS[deptKey]}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block text-[13px] text-[#4A4540]">{CATEGORY_LABELS[post.category]}</span>
                      {post.expectedAction && (
                        <span className="block text-[10px] text-[#9B9590]">{EXPECTED_SHORT[post.expectedAction]}</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-[13px] text-[#7A746E] xl:table-cell">
                      {post.location ?? "—"}
                    </td>
                    <td className="hidden px-3 py-3 text-[13px] text-[#7A746E] lg:table-cell">
                      {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                );
              })}
              {totalFiltered === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[13px] text-[#9B9590]">
                    該当する投稿はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
              className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                safePage <= 1
                  ? "border-border text-[#C0BAB4] cursor-not-allowed"
                  : "border-border text-[#6B6560] hover:bg-[#F5F2EF]"
              }`}
            >
              前へ
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  p === safePage
                    ? "bg-primary-50 text-primary-600 border-[1.5px] border-primary-200"
                    : "text-[#9B9590] hover:bg-[#F5F2EF]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
              className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                safePage >= totalPages
                  ? "border-border text-[#C0BAB4] cursor-not-allowed"
                  : "border-border text-[#6B6560] hover:bg-[#F5F2EF]"
              }`}
            >
              次へ
            </button>
          </div>
        )}
      </main>

      {selectedPost && (
        <DetailPanel
          post={selectedPost}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
