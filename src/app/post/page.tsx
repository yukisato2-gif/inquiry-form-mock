"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATIONS,
  URGENCIES,
  URGENCY_LABELS,
  EXPECTED_ACTION_OPTIONS,
  JOB_TITLES,
} from "@/lib/constants";
import ConfirmModal from "@/components/post/ConfirmModal";
import type { Category, Urgency, ExpectedAction } from "@/types";

interface FormData {
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

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL: FormData = {
  location: "",
  anonymous: true,
  posterName: "",
  jobTitle: "",
  category: "",
  urgency: "",
  body: "",
  occurredAt: "",
  isOngoing: false,
  expectedAction: "",
  hasAttachment: false,
};

/* ─── 共通スタイル ─── */
const inputBase =
  "w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-3 text-[15px] text-[#2D3748] placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";
const sectionCard =
  "mb-5 rounded-xl border-[1.5px] border-border bg-white p-5 sm:p-7";
const sectionTitle =
  "mb-5 text-[15px] font-bold text-[#2D3748]";
const fieldLabel =
  "mb-2 block text-[14px] font-medium text-[#4A4540]";
const requiredMark = " *";
const choiceBase =
  "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-[2px] px-4 py-3 text-[14px] font-medium transition-colors";
const choiceActive =
  "border-primary-500 bg-primary-50 text-primary-700";
const choiceInactive =
  "border-border text-[#6B6560] hover:border-[#C0BAB4] hover:bg-[#F5F2EF]";

export default function PostFormPage() {
  const router = useRouter();
  const addPost = useAppStore((s) => s.addPost);

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.location) e.location = "事業所を選択してください";
    if (!form.category) e.category = "カテゴリを選択してください";
    if (!form.urgency) e.urgency = "緊急度を選択してください";
    if (!form.body.trim()) e.body = "内容を入力してください";
    if (!form.expectedAction) e.expectedAction = "選択してください";
    if (!form.anonymous && !form.posterName.trim()) e.posterName = "氏名を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!validate()) return;
    setShowConfirm(true);
  };

  const hasErrors = submitted && Object.keys(errors).length > 0;

  const handleConfirm = () => {
    const id = addPost({
      location: form.location,
      anonymous: form.anonymous,
      posterName: form.anonymous ? null : form.posterName.trim(),
      jobTitle: form.anonymous ? null : (form.jobTitle || null),
      category: form.category as Category,
      urgency: form.urgency as Urgency,
      body: form.body.trim(),
      occurredAt: form.occurredAt || null,
      isOngoing: form.isOngoing,
      expectedAction: form.expectedAction as ExpectedAction,
      hasAttachment: form.hasAttachment,
    });
    router.push(`/post/complete?id=${id}`);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* ── タイトル ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">現場の声を届ける</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          業務上の課題・気づき・改善提案を受け付けます。
        </p>
      </div>

      {/* ── 匿名性の安心メッセージ ── */}
      <div className="mb-5 flex gap-3 rounded-xl border-[1.5px] border-primary-200 bg-primary-50 px-5 py-4">
        <span className="mt-0.5 shrink-0 text-primary-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </span>
        <div className="text-[14px] leading-relaxed text-[#4A4540]">
          <p>匿名で投稿できます。</p>
          <p className="mt-0.5">投稿内容と個人は紐づかず、誰が書いたか特定されません。</p>
        </div>
      </div>

      {/* ── 内部通報窓口との棲み分け ── */}
      <div className="mb-6 rounded-xl border-[1.5px] border-border bg-white px-5 py-4">
        <p className="text-[13px] leading-relaxed text-[#9B9590]">
          このフォームは業務上の課題・改善提案・気づきを受け付ける窓口です。
          法令違反・不正・重大なハラスメント等は内部通報窓口をご利用ください。
          どちらの窓口か迷う場合も、こちらから投稿いただけます。
        </p>
        <a
          href="https://forms.gle/BLt5fWyMmn2eqNk49"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-border px-4 py-2 text-[13px] font-medium text-[#6B6560] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
        >
          内部通報窓口へ
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* ═══ セクション1: 基本情報 ═══ */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>基本情報</h2>

        {/* 事業所名 */}
        <div className="mb-6">
          <label className={fieldLabel}>事業所名<span className="text-red-500">{requiredMark}</span></label>
          <select
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputBase}
          >
            <option value="">選択してください</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {errors.location && <p className="mt-1.5 text-[13px] text-red-500">{errors.location}</p>}
        </div>

        {/* 記名 / 匿名 */}
        <div className="mb-6">
          <p className={fieldLabel}>記名 / 匿名<span className="text-red-500">{requiredMark}</span></p>
          <div className="flex gap-3">
            {([
              { value: false, label: "記名する" },
              { value: true, label: "匿名で投稿する" },
            ] as const).map((opt) => (
              <label
                key={String(opt.value)}
                className={`${choiceBase} ${form.anonymous === opt.value ? choiceActive : choiceInactive}`}
              >
                <input
                  type="radio"
                  name="anonymous"
                  checked={form.anonymous === opt.value}
                  onChange={() => set("anonymous", opt.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* 記名時: 氏名・職種 */}
        {!form.anonymous && (
          <div className="space-y-5 rounded-xl border-[1.5px] border-border bg-surface p-5">
            <div>
              <label className={fieldLabel}>氏名</label>
              <input
                type="text"
                value={form.posterName}
                onChange={(e) => set("posterName", e.target.value)}
                placeholder="山田 太郎"
                className={inputBase}
              />
              {errors.posterName && <p className="mt-1.5 text-[13px] text-red-500">{errors.posterName}</p>}
            </div>
            <div>
              <label className={fieldLabel}>
                職種 <span className="text-[12px] text-[#B0A9A2]">任意</span>
              </label>
              <select
                value={form.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                className={inputBase}
              >
                <option value="">選択してください</option>
                {JOB_TITLES.map((jt) => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ═══ セクション2: 内容分類 ═══ */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>内容の分類</h2>

        {/* カテゴリ */}
        <div className="mb-6">
          <p className={fieldLabel}>カテゴリ<span className="text-red-500">{requiredMark}</span></p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const selected = form.category === c;
              return (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-[2px] px-3 py-3 text-center text-[14px] font-medium transition-colors ${
                    selected ? choiceActive : choiceInactive
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c}
                    checked={selected}
                    onChange={() => set("category", c)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  {CATEGORY_LABELS[c]}
                </label>
              );
            })}
          </div>
          {errors.category && <p className="mt-1.5 text-[13px] text-red-500">{errors.category}</p>}
        </div>

        {/* 対応ルート表示 */}
        {form.category && (
          <div className="mb-6 rounded-xl border-[1.5px] border-rose-200 bg-rose-50 px-5 py-3">
            <p className="mb-1 text-[13px] text-[#4A4540]">
              本社（ヘルスケア事業部）で一次受信し、内容に応じて関係部署へ連携します。
            </p>
            {(form.category === "labor" || form.category === "relationship") && (
              <p className="text-[12px] text-[#9B9590]">
                {form.category === "labor" && "人員・労務に関する内容は、人事・労務部と連携する場合があります。"}
                {form.category === "relationship" && "人間関係に関する内容は、エリア管理者や人事・労務部と連携する場合があります。"}
              </p>
            )}
            {form.category === "policy" && (
              <p className="text-[12px] text-[#9B9590]">
                制度・運用に関する内容は、総務部と連携する場合があります。
              </p>
            )}
          </div>
        )}

        {/* 緊急度 */}
        <div>
          <p className={fieldLabel}>緊急度<span className="text-red-500">{requiredMark}</span></p>
          <div className="flex gap-2.5">
            {URGENCIES.map((u) => {
              const selected = form.urgency === u;
              const style = u === "urgent" && selected
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : selected
                  ? choiceActive
                  : choiceInactive;
              return (
                <label
                  key={u}
                  className={`${choiceBase} ${style}`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u}
                    checked={selected}
                    onChange={() => set("urgency", u)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  {URGENCY_LABELS[u]}
                </label>
              );
            })}
          </div>
          {errors.urgency && <p className="mt-1.5 text-[13px] text-red-500">{errors.urgency}</p>}
        </div>
      </section>

      {/* ═══ セクション3: 詳細内容 ═══ */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>詳細</h2>

        <div className="mb-6">
          <label className={fieldLabel}>内容<span className="text-red-500">{requiredMark}</span></label>
          <p className="mb-2.5 text-[13px] leading-relaxed text-[#9B9590]">
            起きていること（事実）と、気になっていること・感じていること（意見）を分けて書いてください
          </p>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={7}
            placeholder={"【事実】何が起きているか\n\n【意見】どう感じているか、どうなるとよいか"}
            className={`${inputBase} resize-y leading-relaxed`}
          />
          {errors.body && <p className="mt-1.5 text-[13px] text-red-500">{errors.body}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <label className="text-[14px] font-medium text-[#4A4540]">発生日・時期</label>
            <span className="text-[12px] text-[#B0A9A2]">任意</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={form.occurredAt}
              onChange={(e) => set("occurredAt", e.target.value)}
              className="rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <label className="flex items-center gap-2 text-[14px] text-[#4A4540]">
              <input
                type="checkbox"
                checked={form.isOngoing}
                onChange={(e) => set("isOngoing", e.target.checked)}
                className="h-[18px] w-[18px] rounded border-border text-primary-600 focus:ring-primary-200"
              />
              継続的に発生している
            </label>
          </div>
        </div>
      </section>

      {/* ═══ セクション4: 本社に期待する対応 ═══ */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>本社に期待する対応<span className="text-red-500">{requiredMark}</span></h2>

        <div className="space-y-2.5">
          {EXPECTED_ACTION_OPTIONS.map((opt) => {
            const selected = form.expectedAction === opt.value;
            return (
              <label
                key={opt.value}
                className={`block cursor-pointer rounded-lg border-[2px] px-5 py-4 transition-colors ${
                  selected
                    ? "border-primary-500 bg-primary-50"
                    : "border-border hover:border-[#C0BAB4] hover:bg-[#F5F2EF]"
                }`}
              >
                <input
                  type="radio"
                  name="expectedAction"
                  value={opt.value}
                  checked={selected}
                  onChange={() => set("expectedAction", opt.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
                <span className={`block text-[14px] font-medium ${selected ? "text-primary-700" : "text-[#4A4540]"}`}>
                  {opt.label}
                </span>
                <span className="mt-1 block text-[13px] text-[#9B9590]">
                  {opt.description}
                </span>
              </label>
            );
          })}
        </div>
        {errors.expectedAction && <p className="mt-2 text-[13px] text-red-500">{errors.expectedAction}</p>}
      </section>

      {/* ═══ セクション5: 添付ファイル ═══ */}
      <section className={sectionCard}>
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-bold text-[#2D3748]">添付ファイル</h2>
          <span className="text-[12px] text-[#B0A9A2]">任意</span>
        </div>

        <div className="mt-4">
          {!form.hasAttachment ? (
            <button
              type="button"
              onClick={() => set("hasAttachment", true)}
              className="w-full rounded-lg border-[2px] border-dashed border-border px-4 py-7 text-[14px] text-[#9B9590] transition-colors hover:border-[#C0BAB4] hover:bg-[#F5F2EF] hover:text-[#6B6560]"
            >
              ファイルを選択（写真・資料など）
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-lg border-[1.5px] border-border bg-surface px-5 py-3">
              <span className="text-[14px] text-[#4A4540]">添付ファイル_1.jpg（モック）</span>
              <button
                type="button"
                onClick={() => set("hasAttachment", false)}
                className="text-[13px] text-[#9B9590] hover:text-primary-600"
              >
                取消
              </button>
            </div>
          )}
          <p className="mt-2 text-[12px] text-[#B0A9A2]">
            ※ モック画面のため、実際のアップロードは行われません
          </p>
        </div>
      </section>

      {/* ── 送信ボタン ── */}
      <button
        onClick={handleSubmit}
        className="w-full rounded-xl bg-primary-600 px-4 py-4 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-700"
      >
        内容を確認する
      </button>
      {hasErrors && (
        <p className="mt-3 text-center text-[13px] text-red-500">
          未入力の必須項目があります。赤字の案内をご確認ください。
        </p>
      )}

      {/* ── 確認モーダル ── */}
      {showConfirm && (
        <ConfirmModal
          form={form}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </main>
  );
}
