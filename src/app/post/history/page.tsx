"use client";

import Link from "next/link";

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">投稿の状況確認</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          投稿後に発行された確認コードを使用して、投稿の対応状況を確認できます。
        </p>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/post/status"
          className="block rounded-lg border-[2px] border-primary-500 px-4 py-3 text-center text-[14px] font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          確認コードで状況を確認する
        </Link>
      </div>
    </main>
  );
}
