"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

/** モック用の管理者アカウント定義（本番ではDB＋認証へ移行） */
interface MockAdminAccount {
  id: string;
  password: string;
  role: "hq" | "site_manager";
  label: string;
  /** 拠点管理者の担当拠点（既存 LOCATIONS_BY_AREA の値と完全一致させること） */
  location: string | null;
  redirect: string;
}

const MOCK_ADMIN_ACCOUNTS: MockAdminAccount[] = [
  {
    id: "honsha-admin",
    password: "mock",
    role: "hq",
    label: "本社管理者",
    location: null,
    redirect: "/admin/reception",
  },
  {
    id: "home-hachioji",
    password: "mock",
    role: "site_manager",
    label: "拠点管理者（ホーム長）",
    location: "AMANEKU八王子美山町",
    redirect: "/admin/site-manager/posts",
  },
  {
    id: "home-higashikanamachi",
    password: "mock",
    role: "site_manager",
    label: "拠点管理者（ホーム長）",
    location: "AMANEKU葛飾東金町A棟",
    redirect: "/admin/site-manager/posts",
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const setCurrentSiteLocation = useAppStore((s) => s.setCurrentSiteLocation);

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const account = MOCK_ADMIN_ACCOUNTS.find(
      (a) => a.id === adminId.trim() && a.password === password,
    );

    if (!account) {
      setError("管理者IDまたはパスワードが正しくありません。");
      return;
    }

    // 拠点管理者は担当拠点をセット、本社管理者はクリア
    if (account.role === "site_manager" && account.location) {
      setCurrentSiteLocation(account.location);
    } else {
      setCurrentSiteLocation(null);
    }

    router.push(account.redirect);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-xl border-[1.5px] border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#2D3748]">管理者ログイン</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          管理者IDとパスワードを入力してください。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-id"
              className="mb-1.5 block text-[13px] font-medium text-[#4A4540]"
            >
              管理者ID
            </label>
            <input
              id="admin-id"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-[13px] font-medium text-[#4A4540]"
            >
              パスワード
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-primary-700"
          >
            ログイン
          </button>
        </form>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-[#9B9590]">
        ※この画面はモックです。本番ではログイン認証とサーバー側の権限制御が必要です。
      </p>
    </main>
  );
}
