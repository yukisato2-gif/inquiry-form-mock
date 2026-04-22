"use client";

const SETTING_ITEMS = [
  { label: "ユーザー・権限管理", description: "管理ユーザーの追加・権限設定" },
  { label: "マスタ管理", description: "拠点・カテゴリ・部署の管理" },
  { label: "運用ルール設定", description: "SLA・振り分けルール・通知設定" },
  { label: "監査・ログ", description: "操作ログ・アクセスログの確認" },
  { label: "テンプレート管理", description: "投稿者向けコメントテンプレート" },
];

export default function SettingsPage() {
  return (
    <main className="p-6">
      <h1 className="mb-1 text-lg font-bold text-[#2D3748]">設定</h1>
      <p className="mb-6 text-[13px] text-[#9B9590]">
        システムの各種設定を管理します
      </p>

      <div className="space-y-3">
        {SETTING_ITEMS.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border-[1.5px] border-border bg-white px-5 py-4"
          >
            <p className="text-[14px] font-medium text-[#2D3748]">{item.label}</p>
            <p className="mt-0.5 text-[12px] text-[#9B9590]">{item.description}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-[#B0A9A2]">
        ※ 現在はモック環境のため、各設定項目は表示のみです。
      </p>
    </main>
  );
}
