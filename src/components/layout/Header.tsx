"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import type { Role } from "@/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "poster", label: "投稿者" },
  { value: "reception", label: "管理者" },
];

/** ロール → デフォルト画面パス */
const ROLE_DEFAULT_PATH: Record<string, string> = {
  poster: "/post",
  reception: "/admin",
  management: "/admin",
};

/** 本社管理者ログイン後画面でのみ Header にログアウトボタンを出す。
 *  ホーム長画面 (/admin/site-manager/posts) はページ内に既存のログアウトボタンがあるため除外。 */
const SHOW_LOGOUT_PATHS = new Set([
  "/admin/reception",
  "/admin/dashboard",
  "/admin/settings",
]);

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const currentRole = useAppStore((s) => s.currentRole);
  const setRole = useAppStore((s) => s.setRole);
  const setCurrentSiteLocation = useAppStore((s) => s.setCurrentSiteLocation);

  const displayValue = currentRole === "management" ? "reception" : currentRole;
  const showLogout = SHOW_LOGOUT_PATHS.has(pathname);

  const handleLogout = () => {
    setCurrentSiteLocation(null);
    router.push("/admin");
  };

  return (
    <header className="z-50 border-b border-border bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center text-base font-bold text-primary-600">
          <Image
            src="/logo.png"
            alt="現場の声ロゴ"
            width={192}
            height={174}
            className="h-7 w-auto"
            priority
          />
          <span className="ml-2">現場の声</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            モック環境
          </span>

          {/* ロール切替 */}
          <select
            value={displayValue}
            onChange={(e) => {
              const newRole = e.target.value as Role;
              setRole(newRole);
              const path = ROLE_DEFAULT_PATH[newRole] ?? "/";
              router.push(path);
            }}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-[#2D3748] focus:border-primary-400 focus:outline-none"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {showLogout && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
            >
              ログアウト
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
