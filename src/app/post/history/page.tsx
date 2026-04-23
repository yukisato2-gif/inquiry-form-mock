"use client";

import Link from "next/link";

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">投稿履歴</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          匿名性を守るため、この画面では投稿の一覧表示は行っていません。
        </p>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-primary-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </span>
          <div className="text-[14px] leading-relaxed text-[#4A4540]">
            <p className="mb-2 font-medium">
              投稿後にお渡しした <span className="text-primary-600">確認コード</span> で、投稿ごとの状況を確認できます。
            </p>
            <p className="text-[13px] text-[#7A746E]">
              確認コードはお手元のメモ・スクリーンショットをご参照ください。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/post/status"
            className="rounded-lg border-[2px] border-primary-500 px-4 py-3 text-center text-[14px] font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            確認コードで状況を確認する
          </Link>
          <Link
            href="/post"
            className="py-2 text-center text-[14px] text-[#9B9590] transition-colors hover:text-[#4A4540]"
          >
            新しく投稿する
          </Link>
        </div>
      </div>
    </main>
  );
}
