"use client";

import Link from "next/link";

/**
 * 拠点選択導線は廃止。直URLアクセス時はログイン案内のみを表示する。
 * 拠点はログイン時に自動で割り当てられるため、利用者が選ぶことはできない。
 */
export default function SiteManagerLoginGuardPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-xl border-[1.5px] border-border bg-white p-6 shadow-sm sm:p-8 text-center">
        <h1 className="text-2xl font-bold text-[#2D3748]">管理者ログインが必要です</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#7A746E]">
          拠点管理者の画面はログイン後に表示されます。
          管理者IDとパスワードでログインしてください。
        </p>

        <Link
          href="/admin"
          className="mt-6 inline-block rounded-lg border-[2px] border-primary-500 px-5 py-2.5 text-[14px] font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          管理者ログインへ
        </Link>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-[#9B9590]">
        ※この画面はモックです。本番ではログイン認証とサーバー側の権限制御が必要です。
      </p>
    </main>
  );
}
