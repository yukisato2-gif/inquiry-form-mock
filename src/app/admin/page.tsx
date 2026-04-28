"use client";

import Link from "next/link";

export default function AdminEntryPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">管理者メニュー</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          ご利用の権限を選択してください。
        </p>
      </div>

      <div className="space-y-3.5">
        <Link
          href="/admin/dashboard"
          className="block rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40"
        >
          <p className="text-[15px] font-bold text-[#2D3748]">本社管理者</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#7A746E]">
            ダッシュボード・受付状況・設定を扱います。全件の投稿を確認できます。
          </p>
        </Link>

        <Link
          href="/admin/site-manager"
          className="block rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40"
        >
          <p className="text-[15px] font-bold text-[#2D3748]">拠点管理者（ホーム長）</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#7A746E]">
            担当する拠点を選択し、その拠点の投稿のみを確認します。
          </p>
        </Link>
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-[#9B9590]">
        ※この画面はモックです。本番ではログイン認証とサーバー側の権限制御が必要です。
      </p>
    </main>
  );
}
