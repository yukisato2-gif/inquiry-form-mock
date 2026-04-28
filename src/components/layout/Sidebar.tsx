"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  href: string;
  matchPrefix?: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

/** 投稿者メニュー */
const POSTER_GROUPS: NavGroup[] = [
  {
    section: "投稿メニュー",
    items: [
      { label: "投稿する", href: "/post", matchPrefix: "/post/complete" },
      { label: "状況を確認", href: "/post/status" },
    ],
  },
];

/** 本社メニュー */
const ADMIN_GROUPS: NavGroup[] = [
  {
    section: "運用メニュー",
    items: [
      { label: "ダッシュボード", href: "/admin/dashboard" },
      { label: "受付状況", href: "/admin/reception" },
    ],
  },
  {
    section: "設定メニュー",
    items: [
      { label: "設定", href: "/admin/settings" },
    ],
  },
];

function getGroups(role: Role): NavGroup[] {
  if (role === "poster") return POSTER_GROUPS;
  return ADMIN_GROUPS;
}

/** 左メニューを非表示にするパス（管理者ログイン画面・ガード画面・拠点管理者の投稿一覧） */
const HIDE_SIDEBAR_PATHS = new Set([
  "/admin",
  "/admin/site-manager",
  "/admin/site-manager/posts",
]);

export default function Sidebar() {
  const pathname = usePathname();
  const currentRole = useAppStore((s) => s.currentRole);
  const groups = getGroups(currentRole);

  // ログイン前・ガード画面では左メニュー自体を表示しない
  if (HIDE_SIDEBAR_PATHS.has(pathname)) {
    return null;
  }

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    (item.matchPrefix && pathname.startsWith(item.matchPrefix));

  return (
    <aside className="hidden w-52 shrink-0 border-r border-border bg-white md:block">
      {groups.map((group, gi) => (
        <div key={group.section}>
          {gi > 0 && <div className="mx-4 border-t border-border" />}
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9B9590]">
              {group.section}
            </p>
          </div>
          <nav className="px-3 pb-4">
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative block rounded-lg py-2.5 pr-3 pl-4 text-sm transition-colors ${
                        active
                          ? "bg-primary-50 font-bold text-primary-700"
                          : "text-[#6B6560] hover:bg-[#F5F2EF] hover:text-[#4A4540]"
                      }`}
                    >
                      {active && (
                        <span className="absolute top-2 bottom-2 left-1 w-[3px] rounded-full bg-primary-500" />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ))}
    </aside>
  );
}
