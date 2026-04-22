"use client";

import type { Category, Urgency, ExpectedAction, LocationArea } from "@/types";
import {
  CATEGORY_LABELS,
  URGENCY_LABELS,
  EXPECTED_ACTION_LABELS,
  LOCATION_AREA_LABELS,
} from "@/lib/constants";

interface FormData {
  locationArea: LocationArea | "";
  location: string;
  anonymous: boolean;
  posterName: string;
  jobTitle: string;
  category: Category | "";
  urgency: Urgency | "";
  body: string;
  occurredAt: string;
  isOngoing: boolean;
  expectedAction: ExpectedAction | "";
  hasAttachment: boolean;
}

interface ConfirmModalProps {
  form: FormData;
  onConfirm: () => void;
  onCancel: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[14px]">
      <dt className="w-28 shrink-0 pt-0.5 text-[12px] font-medium text-[#9B9590]">{label}</dt>
      <dd className="min-w-0 text-[#4A4540]">{children}</dd>
    </div>
  );
}

export default function ConfirmModal({ form, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white px-6 pb-6 pt-5 shadow-xl sm:max-h-[85vh] sm:overflow-y-auto sm:rounded-2xl">
        <h2 className="mb-1 text-[16px] font-bold text-[#2D3748]">
          この内容で送信しますか？
        </h2>
        <p className="mb-5 text-[13px] text-[#9B9590]">
          送信後に受付番号が発行されます
        </p>

        <div className="space-y-3 rounded-xl border-[1.5px] border-border bg-surface p-5">
          <Row label="拠点エリア">
            {form.locationArea ? LOCATION_AREA_LABELS[form.locationArea as LocationArea] : "—"}
          </Row>
          <Row label="事業所名">{form.location}</Row>
          <Row label="記名 / 匿名">{form.anonymous ? "匿名で投稿" : "記名"}</Row>
          {!form.anonymous && (
            <>
              <Row label="氏名">{form.posterName}</Row>
              {form.jobTitle && <Row label="職種">{form.jobTitle}</Row>}
            </>
          )}
          <Row label="カテゴリ">
            {form.category ? CATEGORY_LABELS[form.category as Category] : "—"}
          </Row>
          <Row label="緊急度">
            {form.urgency ? URGENCY_LABELS[form.urgency as Urgency] : "—"}
          </Row>
          <Row label="内容">
            <span className="whitespace-pre-wrap leading-relaxed">{form.body}</span>
          </Row>
          {(form.occurredAt || form.isOngoing) && (
            <Row label="発生日・時期">
              {form.occurredAt && <span>{form.occurredAt}</span>}
              {form.occurredAt && form.isOngoing && <span> / </span>}
              {form.isOngoing && <span>継続的に発生</span>}
            </Row>
          )}
          <Row label="期待する対応">
            {form.expectedAction
              ? EXPECTED_ACTION_LABELS[form.expectedAction as ExpectedAction]
              : "—"}
          </Row>
          {form.hasAttachment && (
            <Row label="添付ファイル">ファイルあり（モック）</Row>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border-[2px] border-border px-4 py-3 text-[14px] font-medium text-[#6B6560] transition-colors hover:bg-[#F5F2EF]"
          >
            修正する
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-primary-700"
          >
            送信する
          </button>
        </div>
      </div>
    </div>
  );
}
