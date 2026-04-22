"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { MOCK_ADMIN_USERS, DEPARTMENT_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "poster", label: "投稿者" },
  { value: "reception", label: "本社" },
];

/** テストユーザー候補（3部署の dept_owner） */
const TEST_USERS = MOCK_ADMIN_USERS.filter(
  (u) => ["healthcare", "hr", "management_hq"].includes(u.department) && u.adminRole === "dept_owner",
);

/** ロール → デフォルト画面パス */
const ROLE_DEFAULT_PATH: Record<string, string> = {
  poster: "/post",
  reception: "/admin/dashboard",
  management: "/admin/dashboard",
};

export default function Header() {
  const router = useRouter();
  const currentRole = useAppStore((s) => s.currentRole);
  const setRole = useAppStore((s) => s.setRole);
  const currentAdmin = useAppStore((s) => s.currentAdmin);
  const setCurrentAdmin = useAppStore((s) => s.setCurrentAdmin);

  const displayValue = currentRole === "management" ? "reception" : currentRole;
  const isAdmin = currentRole === "reception" || currentRole === "management";

  return (
    <header className="z-50 border-b border-border bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-base font-bold text-primary-600">
          現場の声
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

          {/* テストユーザー切替（本社ロール時のみ表示） */}
          {isAdmin && (
            <select
              value={currentAdmin.id}
              onChange={(e) => {
                const u = MOCK_ADMIN_USERS.find((u) => u.id === e.target.value);
                if (u) setCurrentAdmin(u);
              }}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px] text-[#4A4540] focus:border-primary-400 focus:outline-none"
            >
              {TEST_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}（{DEPARTMENT_LABELS[u.department]}）
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}
