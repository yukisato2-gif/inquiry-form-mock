"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { CATEGORY_LABELS, POSTER_STATUS_LABELS } from "@/lib/constants";
import type { Status } from "@/types";

const STATUS_DOT: Record<Status, string> = {
  RECEIVED: "bg-[#B0A9A2]",
  CONFIRMED: "bg-primary-400",
  ESCALATED: "bg-amber-400",
  NOTED: "bg-primary-400",
};

export default function HistoryPage() {
  const posts = useAppStore((s) => s.posts);

  const sorted = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">投稿履歴</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          これまでの投稿と受付番号を確認できます。
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border-[1.5px] border-border bg-white px-5 py-12 text-center">
          <p className="text-[14px] text-[#9B9590]">まだ投稿はありません</p>
          <Link
            href="/post"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            投稿する
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border-[1.5px] border-border bg-white">
          {/* ── PC: テーブル表示 ── */}
          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-border bg-[#F5F2EF] text-left text-[12px] font-bold text-[#9B9590]">
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">拠点</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">問い合わせ番号</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3 text-right">状況確認</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((post) => {
                const posterLabel =
                  post.status === "NOTED"
                    ? POSTER_STATUS_LABELS.CONFIRMED
                    : POSTER_STATUS_LABELS[post.status];
                return (
                  <tr
                    key={post.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-[#FAF8F6]"
                  >
                    <td className="px-4 py-3 text-[13px] text-[#7A746E]">
                      {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4A4540]">
                      {post.location ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4A4540]">
                      {CATEGORY_LABELS[post.category]}
                    </td>
                    <td className="px-4 py-3 text-[14px] font-bold text-primary-600">
                      {post.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[13px] text-[#7A746E]">
                        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[post.status]}`} />
                        {posterLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/post/status?id=${post.id}`}
                        className="inline-block rounded-lg border-[1.5px] border-border px-3 py-1.5 text-[12px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
                      >
                        確認する
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── スマホ: 2段構成カード ── */}
          <div className="divide-y divide-border sm:hidden">
            {sorted.map((post) => {
              const posterLabel =
                post.status === "NOTED"
                  ? POSTER_STATUS_LABELS.CONFIRMED
                  : POSTER_STATUS_LABELS[post.status];
              return (
                <div key={post.id} className="px-4 py-3.5">
                  {/* 1段目: 番号 + ステータス */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[15px] font-bold text-primary-600">{post.id}</span>
                    <span className="flex items-center gap-1.5 text-[12px] text-[#7A746E]">
                      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[post.status]}`} />
                      {posterLabel}
                    </span>
                  </div>
                  {/* 2段目: 情報 + ボタン */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#9B9590]">
                      {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                      {post.location && ` ・ ${post.location}`}
                      {` ・ ${CATEGORY_LABELS[post.category]}`}
                    </span>
                    <Link
                      href={`/post/status?id=${post.id}`}
                      className="shrink-0 ml-3 text-[12px] font-medium text-primary-600 hover:text-primary-700"
                    >
                      確認 →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
