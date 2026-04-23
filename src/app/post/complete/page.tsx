"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PostCompletePage() {
  const [inquiryNumber, setInquiryNumber] = useState<string>("");
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInquiryNumber(sessionStorage.getItem("lastInquiryNumber") ?? "");
    setConfirmationCode(sessionStorage.getItem("lastConfirmationCode") ?? "");
  }, []);

  const handleCopy = async () => {
    if (!confirmationCode) return;
    try {
      await navigator.clipboard.writeText(confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード非対応環境は何もしない
    }
  };

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

        <h1 className="mb-2 text-2xl font-bold text-[#2D3748]">受け付けました</h1>
        <p className="mb-2 text-[14px] text-[#7A746E]">あなたの確認コード</p>

        <p className="mb-3 font-mono text-[28px] font-bold tracking-[0.15em] text-primary-600">
          {confirmationCode || "————————"}
        </p>

        {confirmationCode && (
          <button
            type="button"
            onClick={handleCopy}
            className="mb-5 inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-border px-3 py-1.5 text-[12px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                コピーしました
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                コードをコピー
              </>
            )}
          </button>
        )}

        <p className="mb-2 text-[14px] leading-relaxed text-[#4A4540]">
          このコードは後から状況確認に必要です。
        </p>
        <p className="mb-6 text-[13px] leading-relaxed text-[#7A746E]">
          必ずメモまたはスクリーンショットで保管してください。
        </p>

        {/* ── 受付番号（管理用・補助表示） ── */}
        {inquiryNumber && (
          <div className="mb-8 border-t border-border pt-4">
            <p className="text-[11px] text-[#B0A9A2]">
              受付番号（管理用）:{" "}
              <span className="font-mono text-[#9B9590]">{inquiryNumber}</span>
            </p>
          </div>
        )}

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
