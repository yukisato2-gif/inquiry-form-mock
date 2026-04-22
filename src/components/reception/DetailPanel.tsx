"use client";

import type { Post, Status, Urgency, FlowStage, ResponsePolicy } from "@/types";
import { calcSla, type SlaStatus } from "@/lib/sla";
import {
  CATEGORY_LABELS,
  URGENCY_LABELS,
  EXPECTED_ACTION_LABELS,
  CATEGORY_ASSIGNMENTS,
  DEPARTMENT_LABELS,
  FLOW_STAGES,
  FLOW_STAGE_LABELS,
  FLOW_STAGE_SLA,
  RESPONSE_POLICY_LABELS,
  MOCK_ADMIN_USERS,
  DEFAULT_DEPT_OWNER,
} from "@/lib/constants";
import { useAppStore } from "@/stores/useAppStore";
import { useState, useEffect } from "react";

interface DetailPanelProps {
  post: Post;
  onClose: () => void;
}

const URGENCY_STYLES: Record<Urgency, { dot: string; bg: string; text: string }> = {
  urgent:   { dot: "bg-red-500",   bg: "bg-red-50",    text: "text-red-600" },
  normal:   { dot: "bg-[#9B9590]", bg: "bg-[#F5F2EF]", text: "text-[#4A4540]" },
  proposal: { dot: "bg-gray-400",  bg: "bg-gray-100",   text: "text-gray-700" },
};

const POLICIES: ResponsePolicy[] = ["respond", "observe", "inform_only"];

/** expectedAction ごとの推奨方針 */
const RECOMMENDED_POLICY: Record<string, ResponsePolicy | null> = {
  inform: "inform_only",
  area_improve: "respond",
  hq_check: "respond",
  unsure: null,
};

const POLICY_HINT: Record<string, string> = {
  inform: "投稿者の意図は情報共有です。本社判断で他方針も選択できます",
  area_improve: "エリア経由での対応を想定しています",
  hq_check: "本社による直接確認が想定されています",
  unsure: "一次受付で対応方針を判断してください",
};

function SectionHead({ children }: { children: string }) {
  return (
    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#9B9590]">
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-[#9B9590]">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-[#4A4540]">{children}</dd>
    </div>
  );
}

export default function DetailPanel({ post, onClose }: DetailPanelProps) {
  const advanceStage = useAppStore((s) => s.advanceStage);
  const revertStage = useAppStore((s) => s.revertStage);
  const setResponsePolicy = useAppStore((s) => s.setResponsePolicy);
  const updatePostMemo = useAppStore((s) => s.updatePostMemo);
  const assignUser = useAppStore((s) => s.assignUser);
  const setAssignedDept = useAppStore((s) => s.setAssignedDept);
  const updatePublicComment = useAppStore((s) => s.updatePublicComment);
  const currentAdmin = useAppStore((s) => s.currentAdmin);

  const [memo, setMemo] = useState(post.memo);
  const [memoSaved, setMemoSaved] = useState(false);
  const [publicComment, setPublicComment] = useState(post.publicComment ?? "");
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  // 投稿切替時にローカル状態をリセット（保存による post.memo 変化ではトリガーしない）
  useEffect(() => {
    setMemo(post.memo);
    setMemoSaved(false);
    setPublicComment(post.publicComment ?? "");
    setShowCompletionConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const handleMemoSave = () => {
    updatePostMemo(post.id, memo);
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 2000);
  };

  const assignment = CATEGORY_ASSIGNMENTS[post.category];
  const urgStyle = post.urgency ? URGENCY_STYLES[post.urgency] : null;
  // flowStage が未設定の旧データは status から導出
  const currentStage: FlowStage = post.flowStage
    ?? (post.status === "RECEIVED" ? "receipt"
      : post.status === "CONFIRMED" ? "policy"
      : post.status === "ESCALATED" ? "investigation"
      : post.status === "NOTED" ? "completed"
      : "receipt");
  const currentIdx = FLOW_STAGES.indexOf(currentStage);

  // 次の段階（現在が最後なら null）
  const nextStage: FlowStage | null =
    currentIdx < FLOW_STAGES.length - 1 ? FLOW_STAGES[currentIdx + 1] : null;

  // ── 表示用4段階マッピング（内部ロジックは変更しない） ──
  const DISPLAY_STEPS = ["受領確認", "方針決定", "対応実施", "対応完了"] as const;
  const stageToDisplay: Record<string, number> = {
    receipt: 0,
    policy: 1,
    investigation: 2,
    completed: 3,
    reported: 3,
  };
  const displayIdx = (currentStage === "investigation" && showCompletionConfirm)
    ? 3
    : (stageToDisplay[currentStage] ?? 0);

  // 方針決定段階では方針選択が必要
  const needsPolicy = currentStage === "receipt" || currentStage === "policy";

  return (
    <div className="flex w-full flex-col border-l border-border bg-white lg:w-[460px] lg:shrink-0">
      {/* ── ヘッダー ── */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-primary-600">{post.id}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9B9590] hover:bg-[#F5F2EF] hover:text-[#4A4540]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-[#9B9590]">
          {new Date(post.createdAt).toLocaleString("ja-JP")}
        </p>
      </div>

      {/* ── 本体 ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ━━ フローステップ（表示用4段階） ━━ */}
        <div className="border-b border-border bg-[#FAF8F6] px-5 py-4">
          <div className="flex items-center justify-between">
            {DISPLAY_STEPS.map((label, i) => {
              const done = i <= displayIdx;
              const isCurrent = i === displayIdx;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? "bg-primary-500 text-white"
                          : done
                            ? "bg-primary-200 text-primary-700"
                            : "bg-[#E8E4E0] text-[#B0A9A2]"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={`mt-1 text-center text-[10px] leading-tight ${
                      isCurrent
                        ? "font-bold text-primary-700"
                        : done
                          ? "text-primary-500"
                          : "text-[#B0A9A2]"
                    }`}>
                      {label}
                    </span>
                  </div>
                  {i < DISPLAY_STEPS.length - 1 && (
                    <div className={`mx-1 h-[2px] flex-1 rounded ${
                      i < displayIdx ? "bg-primary-300" : "bg-[#E8E4E0]"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          {(() => {
            const sla = calcSla(post);
            const isCompleted = currentStage === "completed" || currentStage === "reported";
            if (isCompleted) return (
              <p className="mt-2 text-center text-[11px] text-[#9B9590]">対応完了</p>
            );
            const color: Record<SlaStatus, string> = {
              ok: "text-[#9B9590]",
              warning: "text-amber-600",
              overdue: "text-red-600 font-bold",
            };
            return (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className={`text-[12px] ${color[sla.status]}`}>{sla.label}</span>
                <span className="text-[10px] text-[#C0BAB4]">（目安: {FLOW_STAGE_SLA[currentStage]}）</span>
              </div>
            );
          })()}
          <p className="mt-1 text-center text-[10px] text-[#B0A9A2]">
            {currentStage === "receipt" && "対応方針を決める段階です"}
            {currentStage === "policy" && "方針に基づき確認を進める段階です"}
            {(currentStage === "investigation") && "対応・確認を進める段階です"}
            {currentStage === "completed" && "対応が完了しました"}
            {currentStage === "reported" && "対応が完了しました"}
          </p>
        </div>

        {/* ━━ 判断材料ハイライト ━━ */}
        <div className="border-b border-border px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {urgStyle && (
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${urgStyle.bg} ${urgStyle.text}`}>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${urgStyle.dot}`} />
                {URGENCY_LABELS[post.urgency!]}
              </span>
            )}
            {post.expectedAction && (
              <span className="rounded-full bg-[#F5F2EF] px-3 py-1 text-[12px] font-medium text-[#4A4540]">
                {EXPECTED_ACTION_LABELS[post.expectedAction]}
              </span>
            )}
            {post.anonymous !== undefined && (
              <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                post.anonymous ? "bg-[#F5F2EF] text-[#9B9590]" : "bg-mint-50 text-mint-600"
              }`}>
                {post.anonymous ? "匿名" : "記名"}
              </span>
            )}
          </div>
        </div>

        {/* ━━ 投稿情報 ━━ */}
        <div className="border-b border-border px-5 py-5">
          <SectionHead>投稿情報</SectionHead>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {post.location && <Field label="事業所">{post.location}</Field>}
            <Field label="カテゴリ">{CATEGORY_LABELS[post.category]}</Field>
            {!post.anonymous && post.posterName && <Field label="氏名">{post.posterName}</Field>}
            {!post.anonymous && post.jobTitle && <Field label="職種">{post.jobTitle}</Field>}
            {(post.occurredAt || post.isOngoing) && (
              <Field label="発生日・時期">
                {post.occurredAt ?? "—"}
                {post.isOngoing && <span className="ml-1 text-[12px] text-primary-500">（継続中）</span>}
              </Field>
            )}
            {post.expectedAction && (
              <Field label="本社に期待する対応">{EXPECTED_ACTION_LABELS[post.expectedAction]}</Field>
            )}
            <Field label="添付">
              {post.hasAttachment
                ? <span className="text-primary-600">あり</span>
                : <span className="text-[#C0BAB4]">なし</span>
              }
            </Field>
          </dl>
        </div>

        {/* ━━ 投稿内容 ━━ */}
        <div className="border-b border-border px-5 py-5">
          <SectionHead>投稿内容</SectionHead>
          <div className="max-h-48 overflow-y-auto rounded-lg border-[1.5px] border-border bg-[#FAF8F6] px-4 py-3">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.8] text-[#2D3748]">{post.body}</p>
          </div>
        </div>

        {/* ━━ 対応情報（受領確認・方針決定段階では非表示。対応実施以降で表示） ━━ */}
        {currentStage !== "receipt" && currentStage !== "policy" && (
        <div className="border-b border-border px-5 py-5">
          <SectionHead>対応情報</SectionHead>
          <dl className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2">
              <dt className="text-[11px] font-medium text-[#9B9590]">対応部署</dt>
              <dd className="text-[#4A4540]">{DEPARTMENT_LABELS[post.assignedDept ?? assignment.primary]}</dd>
            </div>
            {post.responsePolicy && (
              <div className="flex items-center gap-2">
                <dt className="text-[11px] font-medium text-[#9B9590]">対応内容</dt>
                <dd className="text-[#4A4540]">{RESPONSE_POLICY_LABELS[post.responsePolicy]}</dd>
              </div>
            )}
            {post.assignedUser && (
              <div className="flex items-center gap-2">
                <dt className="text-[11px] font-medium text-[#9B9590]">担当者</dt>
                <dd className="text-[#9B9590]">{post.assignedUser}（参考）</dd>
              </div>
            )}
          </dl>
          {post.expectedAction && (
            <div className="mt-3 rounded-lg border-[1.5px] border-border bg-[#FAF8F6] px-4 py-3">
              <p className="text-[11px] font-medium text-[#9B9590]">投稿者の期待する対応</p>
              <p className="mt-1 text-[13px] font-medium text-[#2D3748]">
                {EXPECTED_ACTION_LABELS[post.expectedAction]}
              </p>
            </div>
          )}
        </div>
        )}

        {/* ━━ 段階別アクション ━━ */}
        <div className="border-b border-border px-5 py-5">
          {/* ── 受領確認ステップ ── */}
          {currentStage === "receipt" && (() => {
            const RECEIPT_ALLOWED_DEPTS = ["healthcare"];
            const canReceive = RECEIPT_ALLOWED_DEPTS.includes(currentAdmin.department);
            return (
            <>
              <div className="mb-4 rounded-lg border-[1.5px] border-primary-100 bg-primary-50/50 px-4 py-3">
                <p className="text-[12px] font-bold text-primary-600">内容を確認し、受領してください</p>
                <p className="mt-1 text-[10px] text-[#9B9590]">受領確認後、カテゴリに応じた対応部署・担当者が自動設定されます</p>
              </div>
              <div className="mb-3">
                <p className="text-[11px] text-[#9B9590]">確認者</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#4A4540]">{currentAdmin.name}</p>
              </div>
              <button
                disabled={!canReceive}
                onClick={() => {
                  if (!canReceive) return;
                  const dept = assignment.primary;
                  setAssignedDept(post.id, dept);
                  const defaultOwner = DEFAULT_DEPT_OWNER[dept];
                  if (defaultOwner) {
                    assignUser(post.id, defaultOwner);
                  }
                  advanceStage(post.id, "policy");
                }}
                className={`w-full rounded-lg px-4 py-3 text-[13px] font-bold transition-colors ${
                  canReceive
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                受領確認する
              </button>
              {!canReceive && (
                <p className="mt-1 text-xs text-gray-600">
                  受領確認はヘルスケア事業部のみ実行できます
                </p>
              )}
            </>
            );
          })()}

          {/* ── 方針決定ステップ ── */}
          {currentStage === "policy" && (
            <>
              <div className="mb-4 rounded-lg border-[1.5px] border-primary-100 bg-primary-50/50 px-4 py-3">
                <p className="text-[12px] font-bold text-primary-600">対応部署と対応内容を選択してください</p>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium text-[#9B9590]">対応部署</p>
                <select
                  value={post.assignedDept ?? assignment.primary}
                  onChange={(e) => setAssignedDept(post.id, e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-border bg-white px-3 py-2.5 text-[13px] text-[#4A4540] focus:border-primary-400 focus:outline-none"
                >
                  {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 役割整理 */}
              <div className="mb-4 rounded-lg border-[1.5px] border-border bg-[#FAF8F6] px-4 py-3">
                <p className="mb-2 text-[11px] font-bold text-[#4A4540]">役割整理</p>
                <dl className="space-y-1.5 text-[12px] text-[#4A4540]">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-[#9B9590]">対応責任</dt>
                    <dd>エリア課長／課長代理</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-[#9B9590]">現場対応</dt>
                    <dd>エリア側にて実施</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-[#9B9590]">本社の役割</dt>
                    <dd>進捗確認・モニタリング・必要時のエスカレーション判断</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[10px] text-[#B0A9A2]">※本社は原則として直接対応は行いません。</p>
              </div>

              {/* 対応内容 */}
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium text-[#9B9590]">対応内容</p>
                <select
                  value={post.responsePolicy ?? ""}
                  onChange={(e) => {
                    if (e.target.value) setResponsePolicy(post.id, e.target.value as ResponsePolicy);
                  }}
                  className="w-full rounded-lg border-[1.5px] border-border bg-white px-3 py-2.5 text-[13px] text-[#4A4540] focus:border-primary-400 focus:outline-none"
                >
                  <option value="">選択してください</option>
                  {POLICIES.map((p) => (
                    <option key={p} value={p}>{RESPONSE_POLICY_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => advanceStage(post.id, "investigation")}
                disabled={!post.responsePolicy}
                className={`w-full rounded-lg px-4 py-3 text-[13px] font-bold text-white transition-colors ${
                  post.responsePolicy
                    ? "bg-primary-600 hover:bg-primary-700"
                    : "bg-[#C0BAB4] cursor-not-allowed"
                }`}
              >
                方針決定する
              </button>
              {!post.responsePolicy && (
                <p className="mt-2 text-center text-[10px] text-amber-600">対応内容を選択してください</p>
              )}
              <button
                onClick={() => { if (confirm("前のステップに戻りますか？\n入力内容は保持されます。")) revertStage(post.id, "receipt"); }}
                className="mt-3 w-full text-center text-[12px] text-[#B0A9A2] transition-colors hover:text-[#6B6560]"
              >
                ← 受領確認に戻る
              </button>
            </>
          )}

          {/* ── 対応実施ステップ（入力画面） ── */}
          {currentStage === "investigation" && !showCompletionConfirm && (
            <>
              <div className="mb-4 rounded-lg border-[1.5px] border-primary-100 bg-primary-50/50 px-4 py-3">
                <p className="text-[12px] font-bold text-primary-600">対応・確認の内容を記録してください</p>
              </div>

              {post.responsePolicy && (
                <div className="mb-3">
                  <p className="text-[11px] text-[#9B9590]">方針</p>
                  <p className="mt-0.5 text-[13px] font-medium text-[#4A4540]">{RESPONSE_POLICY_LABELS[post.responsePolicy]}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium text-[#9B9590]">実施内容（内部用）</p>
                <textarea
                  value={memo}
                  onChange={(e) => { setMemo(e.target.value); setMemoSaved(false); }}
                  rows={3}
                  placeholder="対応した内容・確認結果などを記入してください"
                  className="w-full resize-y rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-[#C0BAB4] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium text-[#9B9590]">投稿者への連絡</p>
                <textarea
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={2}
                  placeholder="投稿者に伝えたい進捗や案内を入力してください"
                  className="w-full resize-y rounded-lg border-[1.5px] border-primary-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-[#C0BAB4] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <p className="mt-1 text-[10px] text-[#B0A9A2]">※入力した内容は投稿者の状況確認画面に表示されます</p>
              </div>

              <button
                onClick={() => {
                  // 保存（入力があれば）
                  if (memo.trim()) updatePostMemo(post.id, memo);
                  if (publicComment.trim()) updatePublicComment(post.id, publicComment);
                  // 保存の有無に関係なく、常に完了確認ステップへ遷移
                  setTimeout(() => setShowCompletionConfirm(true), 0);
                }}
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary-700"
              >
                対応内容を更新する
              </button>
              <button
                onClick={() => { if (confirm("前のステップに戻りますか？\n入力内容は保持されます。")) revertStage(post.id, "policy"); }}
                className="mt-3 w-full text-center text-[12px] text-[#B0A9A2] transition-colors hover:text-[#6B6560]"
              >
                ← 方針決定に戻る
              </button>
            </>
          )}

          {/* ── 対応実施ステップ（完了確認画面） ── */}
          {currentStage === "investigation" && showCompletionConfirm && (
            <>
              <div className="mb-4 rounded-lg border-[1.5px] border-primary-100 bg-primary-50/50 px-4 py-3">
                <p className="text-[12px] font-bold text-primary-600">対応内容を確認してください</p>
                <p className="mt-1 text-[11px] text-[#9B9590]">問題なければ「対応完了にする」を押してください</p>
              </div>
              {post.responsePolicy && (
                <div className="mb-3">
                  <p className="text-[11px] text-[#9B9590]">方針</p>
                  <p className="mt-0.5 text-[13px] font-medium text-[#4A4540]">{RESPONSE_POLICY_LABELS[post.responsePolicy]}</p>
                </div>
              )}
              <button
                onClick={() => advanceStage(post.id, "reported")}
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary-700"
              >
                対応完了にする
              </button>
              <button
                onClick={() => setShowCompletionConfirm(false)}
                className="mt-3 w-full text-center text-[12px] text-[#B0A9A2] transition-colors hover:text-[#6B6560]"
              >
                ← 対応実施に戻る
              </button>
            </>
          )}

          {/* ── 完了確認ステップ（レガシーデータ用フォールバック） ── */}
          {currentStage === "completed" && (
            <>
              <div className="mb-4 rounded-lg border-[1.5px] border-primary-100 bg-primary-50/50 px-4 py-3">
                <p className="text-[12px] font-bold text-primary-600">対応内容を確認してください</p>
                <p className="mt-1 text-[11px] text-[#9B9590]">問題なければ「対応完了にする」を押してください</p>
              </div>
              {post.responsePolicy && (
                <div className="mb-3">
                  <p className="text-[11px] text-[#9B9590]">方針</p>
                  <p className="mt-0.5 text-[13px] font-medium text-[#4A4540]">{RESPONSE_POLICY_LABELS[post.responsePolicy]}</p>
                </div>
              )}
              <button
                onClick={() => advanceStage(post.id, "reported")}
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary-700"
              >
                対応完了にする
              </button>
              <button
                onClick={() => { if (confirm("前のステップに戻りますか？\n入力内容は保持されます。")) revertStage(post.id, "investigation"); }}
                className="mt-3 w-full text-center text-[12px] text-[#B0A9A2] transition-colors hover:text-[#6B6560]"
              >
                ← 対応実施に戻る
              </button>
            </>
          )}

          {/* ── 完了後 ── */}
          {currentStage === "reported" && (
            <p className="rounded-lg bg-[#F5F2EF] px-4 py-3 text-center text-[12px] text-[#9B9590]">
              対応フローは完了しています
            </p>
          )}
        </div>

        {/* フロー履歴はUI上非表示（データは保持） */}

        {/* ━━ 対応履歴 ━━ */}
        {(post.actionLog ?? []).length > 0 && (
          <div className="border-b border-border px-5 py-5">
            <SectionHead>対応履歴</SectionHead>
            <p className="-mt-3 mb-3 text-[10px] text-[#B0A9A2]">方針変更・担当変更・進行操作を含みます</p>
            <div className="max-h-56 overflow-y-auto">
              {[...(post.actionLog ?? [])].reverse().map((entry, i, arr) => {
                // 操作種別判定
                const a = entry.action;
                const tag = a.includes("に進めました") ? { label: "進行", color: "bg-[#F0EDEA] text-[#6B6560]" }
                  : a.includes("に戻しました") ? { label: "戻し", color: "bg-[#F0EDEA] text-[#6B6560]" }
                  : a.includes("方針を") ? { label: "方針", color: "bg-primary-50 text-primary-600" }
                  : a.includes("担当者") ? { label: "担当", color: "bg-[#FDF8EC] text-[#9B8540]" }
                  : a.includes("対応部署") ? { label: "部署", color: "bg-rose-50 text-rose-600" }
                  : a.includes("メモ") ? { label: "メモ", color: "bg-yellow-50 text-yellow-700" }
                  : null;
                return (
                <div key={i} className="relative pl-5 pb-4 last:pb-0">
                  {i < arr.length - 1 && (
                    <span className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />
                  )}
                  <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-primary-300 bg-white" />
                  <p className="text-[12px] font-medium text-[#4A4540]">
                    {tag && <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${tag.color}`}>{tag.label}</span>}
                    {entry.action}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#B0A9A2]">
                    {new Date(entry.at).toLocaleString("ja-JP")} · {entry.by}
                  </p>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━ 対応メモ（内部用） ━━ */}
        <div className="px-5 py-5">
          <SectionHead>対応メモ（内部用）</SectionHead>
          <p className="mb-2 text-[10px] text-[#B0A9A2]">投稿者には表示されません</p>
          <textarea
            value={memo}
            onChange={(e) => { setMemo(e.target.value); setMemoSaved(false); }}
            rows={3}
            placeholder={"対応内容・申し送り・記録理由などを記入"}
            className="w-full resize-y rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-[#C0BAB4] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* ── フッター ── */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-[11px] text-[#B0A9A2]">
          更新: {new Date(post.updatedAt).toLocaleString("ja-JP")}
        </p>
        <button
          onClick={handleMemoSave}
          className={`rounded-lg px-4 py-2 text-[12px] font-medium transition-colors ${
            memoSaved
              ? "bg-mint-50 text-mint-600"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        >
          {memoSaved ? "保存しました" : "メモを保存"}
        </button>
      </div>
    </div>
  );
}
