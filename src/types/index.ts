// ============================================
// 現場の声 受付モック — 型定義
// ============================================

/** カテゴリ */
export type Category =
  | "safety"       // 安全管理
  | "quality"      // 支援の質
  | "labor"        // 人員・労務
  | "relationship" // 人間関係
  | "policy"       // 制度・運用
  | "other";       // その他・改善提案

/** 緊急度 */
export type Urgency = "urgent" | "normal" | "proposal";

/** 本社に期待する対応 */
export type ExpectedAction = "inform" | "area_improve" | "hq_check" | "unsure";

/** 拠点エリア（投稿フォーム用の統括エリア区分） */
export type LocationArea = "tokyo" | "kanagawa" | "saitama" | "chiba";

/** ステータス（全状態） */
export type Status = "RECEIVED" | "CONFIRMED" | "ESCALATED" | "NOTED";

/** 投稿者に見せるステータス（NOTED は含めない） */
export type PosterVisibleStatus = Exclude<Status, "NOTED">;

/** ロール */
export type Role = "poster" | "reception" | "management";

/** 管理部署 */
export type Department =
  | "healthcare"    // ヘルスケア事業部
  | "hr"            // 人事・労務部
  | "management_hq" // 経営管理本部
  | "general"       // 総務部
  | "audit";        // 運営監査課

/** 管理ユーザーの役割 */
export type AdminRole = "primary_receiver" | "dept_owner" | "sub_owner" | "admin";

/** 管理ユーザー（モック用） */
export interface AdminUser {
  id: string;
  name: string;
  department: Department;
  adminRole: AdminRole;
}

/** カテゴリごとの担当ルール */
export interface CategoryAssignment {
  primary: Department;
  related: Department[];
}

/** 対応段階（内部管理用フロー） */
export type FlowStage =
  | "receipt"       // 受領確認
  | "policy"        // 方針決定
  | "investigation" // 事実確認
  | "completed"     // 対応完了・記録
  | "reported";     // レポート反映

/** 一次対応方針 */
export type ResponsePolicy = "respond" | "observe" | "inform_only";

/**
 * 投稿データ
 *
 * TODO: 将来は「受付直後（RECEIVED 状態）のみ削除可能」とする想定。
 * 現モックでは削除機能は未実装。
 *
 * 新フォーム項目は optional。既存モックデータとの互換性を保つ。
 */
export interface Post {
  id: string;                         // "V-001" 形式の受付番号
  category: Category;
  body: string;
  location: string | null;            // 事業所名（拠点）
  locationArea?: LocationArea;        // 拠点エリア（投稿フォームから新規追加、旧データ互換のため optional）
  status: Status;
  memo: string;                       // 一次受付メモ（投稿者には非表示）
  createdAt: string;                  // ISO 8601
  updatedAt: string;                  // ISO 8601
  // --- 新フォーム項目（optional: 既存データ互換） ---
  anonymous?: boolean;                // true = 匿名
  posterName?: string | null;         // 記名時の氏名
  jobTitle?: string | null;           // 記名時の職種
  urgency?: Urgency;
  occurredAt?: string | null;         // 発生日
  isOngoing?: boolean;                // 継続的に発生
  expectedAction?: ExpectedAction;
  hasAttachment?: boolean;            // モック用フラグ
  assignedDept?: Department;           // 主担当部署（自動振り分け）
  assignedUser?: string;               // 担当者名（モック用）
  flowStage?: FlowStage;               // 対応段階
  responsePolicy?: ResponsePolicy;     // 一次対応方針
  assignHistory?: AssignRecord[];       // 担当者変更履歴
  actionLog?: ActionLogEntry[];         // 対応履歴
  flowHistory?: FlowRecord[];           // フロー段階変更履歴
  receivedBy?: string;                  // 受領確認者
  publicComment?: string;               // 投稿者向けコメント（外部公開用）
}

/** 担当者変更の履歴レコード */
export interface AssignRecord {
  at: string;       // ISO 8601
  from: string | null;
  to: string;
  by: string;       // 操作者
}

/** 対応履歴のエントリ */
export interface ActionLogEntry {
  at: string;
  by: string;
  action: string;   // 操作の説明テキスト
}

/** フロー段階変更の履歴レコード */
export interface FlowRecord {
  at: string;
  by: string;
  from: FlowStage | null;
  to: FlowStage;
}
