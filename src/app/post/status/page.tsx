"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Post, FlowStage } from "@/types";

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

function StatusContent() {
  const params = useSearchParams();
  const posts = useAppStore((s) => s.posts);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    const idParam = params.get("id");
    if (idParam) {
      setQuery(idParam);
      const found = posts.find(
        (p) => p.id.toLowerCase() === idParam.toLowerCase(),
      );
      setResult(found ?? null);
    }
  }, [params, posts]);

  const handleSearch = () => {
    const found = posts.find(
      (p) => p.id.toLowerCase() === query.trim().toLowerCase(),
    );
    setResult(found ?? null);
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">状況の確認</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          受付番号を入力すると、投稿の状況を確認できます。
        </p>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="例: V-K8F3N2"
            className="flex-1 rounded-lg border-[1.5px] border-border bg-white px-4 py-3 text-[15px] text-[#2D3748] placeholder:text-[#B0A9A2] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
            該当する投稿が見つかりませんでした
          </p>
        )}

        {result && (
          <div className="space-y-5">
            <StepIndicator post={result} />

            <dl className="space-y-3.5 rounded-xl border-[1.5px] border-border bg-surface p-5 text-[14px]">
              <div>
                <dt className="text-[12px] font-medium text-[#9B9590]">受付番号</dt>
                <dd className="mt-0.5 font-semibold text-[#2D3748]">{result.id}</dd>
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
