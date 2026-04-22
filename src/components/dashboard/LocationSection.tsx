"use client";

import { useState, useMemo } from "react";
import { LOCATIONS } from "@/lib/constants";
import type { Post } from "@/types";

interface LocationSectionProps {
  posts: Post[];
}

type TopSort = "count_desc" | "count_asc" | "name_asc" | "name_desc";
type NoPostSort = "name_asc" | "name_desc";

const TOP_SORT_LABELS: Record<TopSort, string> = {
  count_desc: "投稿数が多い順",
  count_asc: "投稿数が少ない順",
  name_asc: "拠点名昇順",
  name_desc: "拠点名降順",
};

const NO_POST_SORT_LABELS: Record<NoPostSort, string> = {
  name_asc: "拠点名昇順",
  name_desc: "拠点名降順",
};

export default function LocationSection({ posts }: LocationSectionProps) {
  const [topSort, setTopSort] = useState<TopSort>("count_desc");
  const [noPostSort, setNoPostSort] = useState<NoPostSort>("name_asc");

  // 拠点ごとの件数を集計
  const countByLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const loc of LOCATIONS) {
      counts[loc] = 0;
    }
    for (const post of posts) {
      if (post.location && counts[post.location] !== undefined) {
        counts[post.location]++;
      }
    }
    return counts;
  }, [posts]);

  // 投稿あり拠点: 全件集計 → ソート → 上位5切り出し
  const topLocations = useMemo(() => {
    const withPosts = Object.entries(countByLocation).filter(([, count]) => count > 0);
    switch (topSort) {
      case "count_desc": withPosts.sort((a, b) => b[1] - a[1]); break;
      case "count_asc": withPosts.sort((a, b) => a[1] - b[1]); break;
      case "name_asc": withPosts.sort((a, b) => a[0].localeCompare(b[0], "ja")); break;
      case "name_desc": withPosts.sort((a, b) => b[0].localeCompare(a[0], "ja")); break;
    }
    return withPosts.slice(0, 5);
  }, [countByLocation, topSort]);

  // 投稿なし拠点: ソート
  const noPostLocations = useMemo(() => {
    const noPosts = Object.entries(countByLocation)
      .filter(([, count]) => count === 0)
      .map(([name]) => name);
    if (noPostSort === "name_desc") noPosts.sort((a, b) => b.localeCompare(a, "ja"));
    else noPosts.sort((a, b) => a.localeCompare(b, "ja"));
    return noPosts;
  }, [countByLocation, noPostSort]);

  const selectClass = "rounded border border-border bg-white px-2 py-0.5 text-[10px] text-[#9B9590] focus:outline-none";

  return (
    <div className="space-y-4">
      {/* 投稿あり拠点 */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            拠点別投稿数
            <span className="ml-2 font-normal normal-case tracking-normal text-slate-300">上位5件</span>
          </h3>
          <select
            value={topSort}
            onChange={(e) => setTopSort(e.target.value as TopSort)}
            className={selectClass}
          >
            {(Object.entries(TOP_SORT_LABELS) as [TopSort, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        {topLocations.length === 0 ? (
          <p className="text-sm text-slate-400">拠点指定のある投稿はありません</p>
        ) : (
          <ul className="space-y-2.5">
            {topLocations.map(([name, count], i) => (
              <li key={name} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-slate-700">{name}</span>
                <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-600">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 投稿がない拠点 */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            投稿がない拠点
            <span className="ml-2 font-normal normal-case tracking-normal text-slate-300">
              {noPostLocations.length}拠点
            </span>
          </h3>
          <select
            value={noPostSort}
            onChange={(e) => setNoPostSort(e.target.value as NoPostSort)}
            className={selectClass}
          >
            {(Object.entries(NO_POST_SORT_LABELS) as [NoPostSort, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        {noPostLocations.length === 0 ? (
          <p className="text-sm text-slate-400">すべての拠点から投稿があります</p>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {noPostLocations.map((name) => (
                <span
                  key={name}
                  className="rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
