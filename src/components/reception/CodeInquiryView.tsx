"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORY_LABELS,
  URGENCY_LABELS,
  LOCATION_AREA_LABELS,
  TIME_SLOT_LABELS,
  CODE_INQUIRY_STATUSES,
  CODE_INQUIRY_STATUS_LABELS,
} from "@/lib/constants";
import type { CodeInquiry, CodeInquiryStatus, LocationArea, Category, Urgency } from "@/types";

const STATUS_CHIP: Record<CodeInquiryStatus, string> = {
  unconfirmed: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-primary-50 text-primary-600",
  emailed: "bg-[#F5F2EF] text-[#6B6560]",
  no_match: "bg-gray-100 text-gray-500",
};

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP");
}

const locationAreaLabel = (area: LocationArea | "") => (area ? LOCATION_AREA_LABELS[area] : "—");
const categoryLabel = (c: Category | "") => (c ? CATEGORY_LABELS[c] : "—");
const urgencyLabel = (u: Urgency | "") => (u ? URGENCY_LABELS[u] : "—");

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-[#9B9590]">{label}</dt>
      <dd className={`mt-0.5 ${bold ? "font-bold text-[#2D3748]" : "text-[#4A4540]"}`}>{value}</dd>
    </div>
  );
}

function InquiryDetail({ inquiry, onClose }: { inquiry: CodeInquiry; onClose: () => void }) {
  const updateStatus = useAppStore((s) => s.updateCodeInquiryStatus);
  const updateMemo = useAppStore((s) => s.updateCodeInquiryMemo);
  const [memoDraft, setMemoDraft] = useState(inquiry.adminMemo);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSaveMemo = () => {
    updateMemo(inquiry.id, memoDraft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className="mt-4 rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[#2D3748]">照会依頼の詳細</h3>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[12px] text-[#9B9590] hover:bg-[#F5F2EF] hover:text-[#4A4540]"
        >
          閉じる
        </button>
      </div>

      <dl className="grid grid-cols-1 gap-3 rounded-xl border-[1.5px] border-border bg-[#FAF8F6] p-4 text-[13px] sm:grid-cols-2">
        <Field label="照会依頼ID" value={inquiry.id} bold />
        <Field label="依頼日時" value={formatDateTime(inquiry.requestedAt)} />
        <Field label="投稿日" value={inquiry.date || "—"} />
        <Field label="時間帯" value={TIME_SLOT_LABELS[inquiry.timeSlot] ?? "—"} />
        <Field label="拠点エリア" value={locationAreaLabel(inquiry.locationArea)} />
        <Field label="事業所名" value={inquiry.location || "—"} />
        <Field label="カテゴリ" value={categoryLabel(inquiry.category)} />
        <Field label="緊急度" value={urgencyLabel(inquiry.urgency)} />
        <div className="sm:col-span-2">
          <Field label="投稿内容の一部" value={inquiry.bodyKeyword || "—"} />
        </div>
        <div className="sm:col-span-2">
          <Field label="メールアドレス" value={inquiry.email || "—"} />
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-1.5 text-[12px] font-medium text-[#4A4540]">状態</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={inquiry.status}
            onChange={(e) => updateStatus(inquiry.id, e.target.value as CodeInquiryStatus)}
            className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#4A4540] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {CODE_INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>{CODE_INQUIRY_STATUS_LABELS[s]}</option>
            ))}
          </select>
          {inquiry.status !== "emailed" && (
            <button
              onClick={() => updateStatus(inquiry.id, "emailed")}
              className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[12px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
            >
              メール送信済にする
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[12px] font-medium text-[#4A4540]">管理者メモ</p>
        <textarea
          value={memoDraft}
          onChange={(e) => setMemoDraft(e.target.value)}
          rows={4}
          placeholder="確認した内容、対応履歴、メール送信状況、該当なし判断の理由など"
          className="w-full rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[13px] text-[#4A4540] placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleSaveMemo}
            className="rounded-lg bg-primary-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            メモを保存
          </button>
          {savedFlash && <span className="text-[11px] text-primary-600">保存しました</span>}
        </div>
      </div>
    </div>
  );
}

export default function CodeInquiryView() {
  const codeInquiries = useAppStore((s) => s.codeInquiries);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? codeInquiries.find((q) => q.id === selectedId) ?? null : null;

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[14px] font-bold text-[#2D3748]">確認コード照会依頼</h2>
        <p className="mt-0.5 text-[12px] text-[#9B9590]">
          投稿者から送信された確認コードの照会依頼一覧です。状態を更新し、必要に応じてメールでコードを案内してください。
        </p>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F5F2EF] text-left text-[12px] font-bold text-[#9B9590]">
                <th className="px-3 py-3">依頼日時</th>
                <th className="px-3 py-3">投稿日</th>
                <th className="px-3 py-3">時間帯</th>
                <th className="px-3 py-3">拠点エリア</th>
                <th className="px-3 py-3">事業所名</th>
                <th className="px-3 py-3">カテゴリ</th>
                <th className="px-3 py-3">緊急度</th>
                <th className="px-3 py-3">メール</th>
                <th className="px-3 py-3">状態</th>
              </tr>
            </thead>
            <tbody>
              {codeInquiries.map((q) => {
                const isSelected = selectedId === q.id;
                return (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedId(isSelected ? null : q.id)}
                    className={`cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                      isSelected ? "bg-primary-50/60" : "hover:bg-[#FAF8F6]"
                    }`}
                  >
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">
                      {formatDateTime(q.requestedAt)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">{q.date || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">
                      {TIME_SLOT_LABELS[q.timeSlot] ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">
                      {locationAreaLabel(q.locationArea)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">{q.location || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">{categoryLabel(q.category)}</td>
                    <td className="px-3 py-3 text-[12px] text-[#4A4540]">{urgencyLabel(q.urgency)}</td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-[12px] text-[#4A4540]">
                      {q.email || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[q.status]}`}
                      >
                        {CODE_INQUIRY_STATUS_LABELS[q.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {codeInquiries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[13px] text-[#9B9590]">
                    照会依頼はまだありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <InquiryDetail inquiry={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
