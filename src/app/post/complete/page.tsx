"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function CompleteContent() {
  const params = useSearchParams();
  const id = params.get("id") ?? "---";

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:py-16 text-center">
      <div className="rounded-xl border-[1.5px] border-border bg-white p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-mint-50">
          <svg
            className="h-7 w-7 text-mint-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-[#2D3748]">
          受け付けました
        </h1>
        <p className="mb-1 text-[14px] text-[#9B9590]">あなたの受付番号</p>
        <p className="mb-5 text-2xl font-bold text-primary-600">{id}</p>
        <p className="mb-2 text-[14px] leading-relaxed text-[#7A746E]">
          この番号で、あとから投稿の状況を確認できます。
        </p>
        <p className="mb-8 text-[12px] text-[#B0A9A2]">
          ※ 番号はランダムに生成されており、他の人からは推測できません
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/post/status"
            className="rounded-lg border-[2px] border-primary-500 px-4 py-3 text-[14px] font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            状況を確認する
          </Link>
          <Link
            href="/post"
            className="py-2 text-[14px] text-[#9B9590] transition-colors hover:text-[#4A4540]"
          >
            続けて投稿する
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PostCompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}
