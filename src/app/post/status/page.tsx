"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  CATEGORY_LABELS,
  CATEGORIES,
  URGENCY_LABELS,
  URGENCIES,
  LOCATION_AREAS,
  LOCATION_AREA_LABELS,
  LOCATIONS_BY_AREA,
} from "@/lib/constants";
import type { Post, FlowStage, Category, Urgency, LocationArea } from "@/types";

/** 確認コードを忘れた場合の検索：時間帯マスタ */
const TIME_SLOT_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "morning", label: "朝" },
  { value: "noon", label: "昼" },
  { value: "evening", label: "夕方" },
  { value: "night", label: "夜" },
  { value: "midnight", label: "深夜" },
  { value: "unknown", label: "不明" },
] as const;

type TimeSlot = (typeof TIME_SLOT_OPTIONS)[number]["value"];

/** 投稿時刻が指定の時間帯に該当するか判定（unknown / 空は常に true） */
function isInTimeSlot(hour: number, slot: TimeSlot): boolean {
  switch (slot) {
    case "morning":  return hour >= 5  && hour <= 10;
    case "noon":     return hour >= 11 && hour <= 14;
    case "evening":  return hour >= 15 && hour <= 17;
    case "night":    return hour >= 18 && hour <= 21;
    case "midnight": return hour >= 22 || hour <= 4;
    default:         return true; // "" | "unknown" → フィルタなし
  }
}

interface ForgotSearchForm {
  date: string;                    // YYYY-MM-DD（任意）
  timeSlot: TimeSlot;
  locationArea: LocationArea | "";
  location: string;
  category: Category | "";
  urgency: Urgency | "";
  bodyKeyword: string;
  email: string;                   // 確認コード案内先（任意）
}

const FORGOT_INITIAL: ForgotSearchForm = {
  date: "",
  timeSlot: "",
  locationArea: "",
  location: "",
  category: "",
  urgency: "",
  bodyKeyword: "",
  email: "",
};

/** 投稿者向け5段階ステップ定義 */
const POSTER_STEPS: { stage: FlowStage | "initial"; before: string; after: string }[] = [
  { stage: "initial",       before: "受付けました",           after: "受付けました" },
  { stage: "receipt",        before: "内容を確認しています",     after: "内容を確認しました" },
  { stage: "policy",         before: "対応方針を検討しています", after: "対応方針を決定しました" },
  { stage: "investigation",  before: "対応を進めています",       after: "対応を進めています" },
  { stage: "completed",      before: "対応が完了しました",       after: "対応が完了しました" },
];

/** ステップインデックスと現在段階から、表示ラベルを決定する */
function getStepLabel(stepIdx: number, activeIdx: number): string {
  const step = POSTER_STEPS[stepIdx];
  if (!step) return "";
  if (stepIdx < activeIdx) return step.after;   // 完了済み → 完了形
  if (stepIdx === activeIdx) return step.before; // 現在地 → 進行形
  return step.before;                            // 未到達 → 進行形（デフォルト）
}

/** status → flowStage 導出（flowStage 未設定の旧データ用） */
function deriveStage(post: Post): FlowStage {
  if (post.flowStage) return post.flowStage;
  switch (post.status) {
    case "RECEIVED": return "receipt";
    case "CONFIRMED": return "policy";
    case "ESCALATED": return "investigation";
    case "NOTED": return "completed";
    default: return "receipt";
  }
}

/** 段階ごとのデフォルト文（publicComment 未入力時に表示） */
function getDefaultComment(stage: FlowStage): string {
  switch (stage) {
    case "receipt": return "投稿内容を確認しています。確認完了までしばらくお待ちください。";
    case "policy": return "対応方針を決定しました。具体的な対応を進めていきます。";
    case "investigation": return "決定した方針に沿って、対応を進めています。しばらくお待ちください。";
    case "completed":
    case "reported": return "対応が完了しました。ご投稿ありがとうございました。";
    default: return "投稿を受け付けました。内容を確認いたします。";
  }
}

/** flowStage → 投稿者向け5段階インデックス */
function toDisplayIndex(stage: FlowStage): number {
  switch (stage) {
    case "receipt": return 1;
    case "policy": return 2;
    case "investigation": return 3;
    case "completed":
    case "reported": return 4;
    default: return 0;
  }
}

function StepIndicator({ post }: { post: Post }) {
  const stage = deriveStage(post);
  const activeIdx = toDisplayIndex(stage);

  return (
    <div className="flex items-center justify-between">
      {POSTER_STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <div key={step.stage} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
                  isCurrent
                    ? "bg-primary-500 text-white"
                    : done
                      ? "bg-primary-200 text-primary-700"
                      : "bg-[#E8E4E0] text-[#B0A9A2]"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-1.5 max-w-[72px] text-center text-[10px] leading-tight ${
                  isCurrent
                    ? "font-bold text-primary-700"
                    : done
                      ? "font-medium text-primary-500"
                      : "text-[#B0A9A2]"
                }`}
              >
                {getStepLabel(i, activeIdx)}
              </span>
            </div>
            {i < POSTER_STEPS.length - 1 && (
              <div
                className={`mx-1 h-[2px] flex-1 rounded ${
                  i < activeIdx ? "bg-primary-300" : "bg-[#E8E4E0]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 入力された確認コードを正規化（英数字以外除去 + 大文字化） */
function normalizeCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function StatusContent() {
  const posts = useAppStore((s) => s.posts);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Post | null | undefined>(undefined);

  // 確認コードの照会依頼（既存ロジックには影響しない独立 state）
  // 匿名性保護のため、この画面では検索結果を一切表示せず、
  // 入力内容は管理者側で確認 → メールで案内する想定に変更
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotForm, setForgotForm] = useState<ForgotSearchForm>(FORGOT_INITIAL);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const setForgot = <K extends keyof ForgotSearchForm>(key: K, value: ForgotSearchForm[K]) => {
    setForgotForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleForgotAreaChange = (value: LocationArea | "") => {
    setForgotForm((prev) => ({ ...prev, locationArea: value, location: "" }));
  };

  const handleForgotSubmit = () => {
    setForgotSubmitted(true);
  };

  const forgotLocationOptions = forgotForm.locationArea
    ? LOCATIONS_BY_AREA[forgotForm.locationArea]
    : [];

  const handleSearch = () => {
    const normalized = normalizeCode(query);
    if (!normalized) {
      setResult(null);
      return;
    }
    const found = posts.find(
      (p) => p.confirmationCode && p.confirmationCode.toUpperCase() === normalized,
    );
    setResult(found ?? null);
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">状況の確認</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          投稿後に発行された確認コードで、投稿の状況を確認できます。
        </p>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm sm:p-7">
        <label className="mb-2 block text-[14px] font-medium text-[#4A4540]">
          確認コード
        </label>
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="確認コードを入力してください"
            autoComplete="off"
            className="flex-1 rounded-lg border-[1.5px] border-border bg-white px-4 py-3 font-mono text-[15px] tracking-[0.1em] text-[#2D3748] placeholder:font-sans placeholder:tracking-normal placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-primary-600 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            確認
          </button>
        </div>

        {result === null && (
          <p className="py-4 text-center text-[14px] text-[#9B9590]">
            確認コードが見つかりませんでした。お手元のコードをもう一度ご確認ください。
          </p>
        )}

        {result && (
          <div className="space-y-5">
            <StepIndicator post={result} />

            <dl className="space-y-3.5 rounded-xl border-[1.5px] border-border bg-surface p-5 text-[14px]">
              <div>
                <dt className="text-[12px] font-medium text-[#9B9590]">受付番号</dt>
                <dd className="mt-0.5 font-bold text-[#2D3748]">{result.inquiryNumber ?? result.id}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-[#9B9590]">カテゴリ</dt>
                <dd className="mt-0.5 text-[#4A4540]">
                  {CATEGORY_LABELS[result.category]}
                </dd>
              </div>
              {result.location && (
                <div>
                  <dt className="text-[12px] font-medium text-[#9B9590]">拠点</dt>
                  <dd className="mt-0.5 text-[#4A4540]">{result.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-[12px] font-medium text-[#9B9590]">投稿した内容</dt>
                <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-[#4A4540]">
                  {result.body}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-[#9B9590]">投稿日時</dt>
                <dd className="mt-0.5 text-[#7A746E]">
                  {new Date(result.createdAt).toLocaleString("ja-JP")}
                </dd>
              </div>
            </dl>

            {/* 対応状況コメント */}
            {(() => {
              const stage = deriveStage(result);
              const activeIdx = toDisplayIndex(stage);
              const displayComment = result.publicComment?.trim()
                || getDefaultComment(stage);
              const stepLabel = getStepLabel(activeIdx, activeIdx);
              return (
                <div className="rounded-xl border-[1.5px] border-primary-100 bg-primary-50/40 p-5">
                  <p className="mb-1 text-[12px] font-bold text-primary-600">対応状況</p>
                  <p className="text-[13px] font-medium text-[#2D3748]">{stepLabel}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#4A4540]">{displayComment}</p>
                  <p className="mt-2 text-[10px] text-[#B0A9A2]">
                    最終更新: {new Date(result.updatedAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── 確認コードを忘れた場合（補助導線） ── */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setForgotOpen((o) => !o)}
          aria-expanded={forgotOpen}
          className="inline-flex items-center gap-1 text-[13px] text-primary-600 hover:underline"
        >
          確認コードを忘れた場合はこちら
          <span aria-hidden="true" className="text-[11px]">{forgotOpen ? "▲" : "▼"}</span>
        </button>

        {forgotOpen && (
          <div className="mt-3 rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 text-[16px] font-bold text-[#2D3748]">確認コードを忘れた場合</h2>

            {!forgotSubmitted ? (
              <>
                <p className="mb-2 text-[13px] leading-relaxed text-[#7A746E]">
                  投稿時の情報をもとに、管理者へ確認コードの照会を依頼できます。
                  <br />
                  入力内容を確認後、該当する投稿が見つかった場合のみ、入力されたメールアドレス宛に確認コードをご案内します。
                </p>
                <p className="mb-5 text-[12px] leading-relaxed text-[#9B9590]">
                  ※匿名性保護のため、この画面上には投稿内容や検索結果は表示されません。
                </p>

                <div className="space-y-4">
                  {/* 投稿日 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">投稿日</label>
                    <input
                      type="date"
                      value={forgotForm.date}
                      onChange={(e) => setForgot("date", e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  {/* 時間帯 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">時間帯</label>
                    <select
                      value={forgotForm.timeSlot}
                      onChange={(e) => setForgot("timeSlot", e.target.value as TimeSlot)}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      {TIME_SLOT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 拠点エリア */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">拠点エリア</label>
                    <select
                      value={forgotForm.locationArea}
                      onChange={(e) => handleForgotAreaChange(e.target.value as LocationArea | "")}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">選択してください</option>
                      {LOCATION_AREAS.map((area) => (
                        <option key={area} value={area}>{LOCATION_AREA_LABELS[area]}</option>
                      ))}
                    </select>
                  </div>

                  {/* 事業所名 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">事業所名</label>
                    <select
                      value={forgotForm.location}
                      onChange={(e) => setForgot("location", e.target.value)}
                      disabled={!forgotForm.locationArea}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-[#F5F2EF] disabled:text-[#B0A9A2]"
                    >
                      <option value="">選択してください</option>
                      {forgotLocationOptions.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">カテゴリ</label>
                    <select
                      value={forgotForm.category}
                      onChange={(e) => setForgot("category", e.target.value as Category | "")}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">選択してください</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>

                  {/* 緊急度 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">緊急度</label>
                    <select
                      value={forgotForm.urgency}
                      onChange={(e) => setForgot("urgency", e.target.value as Urgency | "")}
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">選択してください</option>
                      {URGENCIES.map((u) => (
                        <option key={u} value={u}>{URGENCY_LABELS[u]}</option>
                      ))}
                    </select>
                  </div>

                  {/* 投稿内容の一部 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">投稿内容の一部</label>
                    <input
                      type="text"
                      value={forgotForm.bodyKeyword}
                      onChange={(e) => setForgot("bodyKeyword", e.target.value)}
                      placeholder="例：夜勤体制、設備不備、シフトなど"
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  {/* メールアドレス（任意） — 管理者からの確認コード案内先 */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#4A4540]">
                      メールアドレス（任意）
                    </label>
                    <input
                      type="email"
                      value={forgotForm.email}
                      onChange={(e) => setForgot("email", e.target.value)}
                      placeholder="example@example.com"
                      autoComplete="email"
                      className="w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-[14px] text-[#2D3748] placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#9B9590]">
                      確認コードのご案内が必要な場合のみ入力してください。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotSubmit}
                    className="w-full rounded-lg bg-primary-600 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    確認コードの照会を依頼する
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-[1.5px] border-primary-100 bg-primary-50/40 p-5 text-[13px] leading-relaxed text-[#4A4540]">
                <p className="mb-2 font-bold text-primary-700">確認コードの照会依頼を受け付けました。</p>
                <p>
                  管理者側で内容を確認します。
                  <br />
                  該当する投稿が確認できた場合のみ、入力されたメールアドレス宛に確認コードをご案内します。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  );
}
