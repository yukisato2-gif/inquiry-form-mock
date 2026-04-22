import type { Post, FlowStage } from "@/types";
import { FLOW_STAGE_SLA_DAYS } from "@/lib/constants";

export type SlaStatus = "ok" | "warning" | "overdue";

export interface SlaInfo {
  /** 経過日数 */
  elapsed: number;
  /** SLA日数 */
  limit: number;
  /** 残り日数（負 = 超過） */
  remaining: number;
  /** 状態 */
  status: SlaStatus;
  /** 表示ラベル */
  label: string;
}

/**
 * 投稿の現在段階におけるSLA情報を計算する（モック用簡易版）
 *
 * - updatedAt を「現在段階に入った日」として扱う
 * - reported 段階は常に ok
 */
export function calcSla(post: Post): SlaInfo {
  const stage: FlowStage = post.flowStage ?? "receipt";
  const limit = FLOW_STAGE_SLA_DAYS[stage];

  // reported は月次なので常にOK扱い
  if (stage === "reported") {
    return { elapsed: 0, limit, remaining: limit, status: "ok", label: "月次" };
  }

  const base = new Date(post.updatedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - base) / (1000 * 60 * 60 * 24));
  const remaining = limit - elapsed;

  let status: SlaStatus;
  let label: string;

  if (remaining < 0) {
    status = "overdue";
    label = `${Math.abs(remaining)}日超過`;
  } else if (remaining === 0) {
    status = "warning";
    label = "本日まで";
  } else if (remaining <= 1) {
    status = "warning";
    label = `あと${remaining}日`;
  } else {
    status = "ok";
    label = `あと${remaining}日`;
  }

  return { elapsed, limit, remaining, status, label };
}
