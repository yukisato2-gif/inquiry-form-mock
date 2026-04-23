import type { Category, Status, Role, Urgency, ExpectedAction, LocationArea } from "@/types";

// ============================================
// カテゴリ
// ============================================
export const CATEGORY_LABELS: Record<Category, string> = {
  safety: "安全管理",
  quality: "支援の質",
  labor: "人員・労務",
  relationship: "人間関係",
  policy: "制度・運用",
  other: "その他・改善提案",
};

export const CATEGORIES: Category[] = Object.keys(CATEGORY_LABELS) as Category[];

/** カテゴリごとの説明文（投稿フォームの選択補助用） */
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  safety: "事故の予兆、設備不備、夜間体制の不安",
  quality: "ケアの方法への疑問、利用者様への不適切対応目撃",
  labor: "慢性的な人手不足、過重労働、シフトの偏り",
  relationship: "ハラスメント疑惑、職員間の深刻な対立",
  policy: "本社の指示と現場の実態の乖離、ルールの形骸化",
  other: "業務効率化のアイデア、ポジティブな提案",
};

/** カテゴリごとの想定対応ルート */
export const CATEGORY_ROUTES: Record<Category, string[]> = {
  safety: ["エリア課長・課長代理", "ヘルスケア事業部"],
  quality: ["エリア課長・課長代理", "ヘルスケア事業部"],
  labor: ["人事・労務部", "ヘルスケア事業部"],
  relationship: ["エリア課長・課長代理", "ヘルスケア事業部", "人事・労務部（必要時）"],
  policy: ["エリア課長・課長代理", "ヘルスケア事業部", "総務部（必要時）"],
  other: ["エリア課長・課長代理", "ヘルスケア事業部"],
};

// ============================================
// 緊急度
// ============================================
export const URGENCY_LABELS: Record<Urgency, string> = {
  urgent: "至急",
  normal: "通常",
  proposal: "改善提案",
};

export const URGENCIES: Urgency[] = ["urgent", "normal", "proposal"];

// ============================================
// 本社に期待する対応
// ============================================
export const EXPECTED_ACTION_OPTIONS: {
  value: ExpectedAction;
  label: string;
  description: string;
}[] = [
  {
    value: "inform",
    label: "状況を知っておいてほしい",
    description: "情報共有として受け付けます",
  },
  {
    value: "area_improve",
    label: "エリア管理者に改善を働きかけてほしい",
    description: "エリア経由での確認・改善依頼を想定します",
  },
  {
    value: "hq_check",
    label: "本社として直接確認してほしい",
    description: "本社側での確認が必要なケースを想定します",
  },
  {
    value: "unsure",
    label: "どう対応すべきか分からない",
    description: "一次受付で対応方針を判断します",
  },
];

export const EXPECTED_ACTION_LABELS: Record<ExpectedAction, string> = {
  inform: "状況を知っておいてほしい",
  area_improve: "エリア管理者に改善を働きかけてほしい",
  hq_check: "本社として直接確認してほしい",
  unsure: "どう対応すべきか分からない",
};

// ============================================
// 職種
// ============================================
export const JOB_TITLES: string[] = [
  "生活支援員",
  "世話人",
  "サービス管理責任者",
  "看護",
  "その他",
];

// ============================================
// ステータス
// ============================================
export const STATUS_LABELS: Record<Status, string> = {
  RECEIVED: "受付済",
  CONFIRMED: "確認済",
  ESCALATED: "エスカレーション",
  NOTED: "対応済（記録）",
};

/** 投稿者に見せるステータス一覧 */
export const POSTER_VISIBLE_STATUSES: Status[] = ["RECEIVED", "CONFIRMED", "ESCALATED"];

/** 投稿者向けのやさしいステータスラベル */
export const POSTER_STATUS_LABELS: Record<Status, string> = {
  RECEIVED: "受け付けました",
  CONFIRMED: "確認しています",
  ESCALATED: "対応を進めています",
  NOTED: "確認しています",
};

// ============================================
// 拠点エリア（投稿フォーム用マスタ）
// ============================================
export const LOCATION_AREA_LABELS: Record<LocationArea, string> = {
  tokyo: "東京統括エリア",
  kanagawa: "神奈川統括エリア",
  saitama: "埼玉統括エリア",
  chiba: "千葉統括エリア",
};

export const LOCATION_AREAS: LocationArea[] = ["tokyo", "kanagawa", "saitama", "chiba"];

/** 拠点エリアごとの拠点一覧（投稿フォームの事業所名プルダウン用） */
export const LOCATIONS_BY_AREA: Record<LocationArea, string[]> = {
  tokyo: [
    "AMANEKU八王子美山町",
    "AMANEKU八王子美山町B棟",
    "AMANEKU青梅谷野",
    "AMANEKU八王子宮下町",
    "AMANEKU八王子中野山王",
    "AMANEKU八王子川口町A棟",
    "AMANEKU八王子川口町B棟",
    "AMANEKU八王子川口町C棟",
    "AMANEKU八王子田町",
    "AMANEKU昭島田中町",
    "AMANEKU練馬大泉学園",
    "AMANEKU葛飾東金町A棟",
    "AMANEKU葛飾東金町B棟",
    "AMANEKU葛飾西水元",
  ],
  kanagawa: [
    "AMANEKU南足柄",
    "AMANEKU南足柄飯沢",
    "AMANEKU南足柄広町",
    "AMANEKU平塚",
    "AMANEKU茅ヶ崎萩園",
    "AMANEKU川崎麻生A棟",
    "AMANEKU川崎麻生B棟",
    "AMANEKU町田野津田町",
    "AMANEKU横浜戸塚原宿A棟",
    "AMANEKU横浜戸塚原宿B棟",
    "AMANEKU横浜上飯田町",
    "AMANEKU横浜戸塚町",
  ],
  saitama: [
    "AMANEKU加須",
    "AMANEKU熊谷妻沼",
    "AMANEKU久喜上内",
    "AMANEKU狭山中央",
    "AMANEKU朝霞溝沼",
    "AMANEKU鶴ヶ島藤金",
    "AMANEKU野田中里",
    "AMANEKU野田琴平",
    "AMANEKU野田川間",
  ],
  chiba: [
    "AMANEKU花見川",
    "AMANEKU千葉矢作町A棟",
    "AMANEKU千葉矢作町B棟",
    "AMANEKU袖ヶ浦横田",
    "AMANEKU千葉大木戸町A棟",
    "AMANEKU千葉大木戸町B棟",
    "AMANEKU千葉仁戸名町",
    "AMANEKU千葉加曽利町A棟",
    "AMANEKU千葉加曽利町B棟",
    "AMANEKU千葉加曽利町C棟",
    "AMANEKU千葉生実町",
  ],
};

// ============================================
// 拠点（既存: 管理系画面のマスタ。投稿フォームでは使用しない）
// ============================================
export const LOCATIONS: string[] = [
  "AMANEKU八王子美山町",
  "AMANEKU八王子美山町B棟",
  "AMANEKU青梅谷野",
  "AMANEKU八王子宮下町",
  "AMANEKU八王子川口町A棟",
  "AMANEKU八王子川口町B棟",
  "AMANEKU八王子川口町C棟",
  "AMANEKU八王子田町",
  "AMANEKU葛飾東金町A棟",
  "AMANEKU葛飾東金町B棟",
  "AMANEKU葛飾西水元",
  "AMANEKU南足柄",
  "AMANEKU南足柄飯沢",
  "AMANEKU南足柄広町",
  "AMANEKU平塚西之宮",
  "AMANEKU茅ヶ崎萩園",
  "AMANEKU川崎麻生A棟",
  "AMANEKU川崎麻生B棟",
  "AMANEKU町田野津田町",
  "AMANEKU横浜戸塚原宿A棟",
  "AMANEKU横浜戸塚原宿B棟",
  "AMANEKU横浜上飯田町",
  "AMANEKU横浜戸塚町",
  "AMANEKU加須",
  "AMANEKU熊谷妻沼",
  "AMANEKU久喜上内",
  "AMANEKU狭山中央",
  "AMANEKU朝霞溝沼",
  "AMANEKU鶴ヶ島藤金",
  "AMANEKU野田中里",
  "AMANEKU野田琴平",
  "AMANEKU野田川間東",
  "AMANEKU花見川",
  "AMANEKU千葉矢作町A棟",
  "AMANEKU千葉矢作町B棟",
  "AMANEKU袖ヶ浦横田",
  "AMANEKU千葉大木戸町A棟",
  "AMANEKU千葉大木戸町B棟",
  "AMANEKU千葉仁戸名町",
  "AMANEKU千葉加曽利町A棟",
  "AMANEKU千葉加曽利町B棟",
  "AMANEKU千葉加曽利町C棟",
];

// ============================================
// ロール
// ============================================
export const ROLE_LABELS: Record<Role, string> = {
  poster: "投稿者",
  reception: "本社",
  management: "本社",
};

// ============================================
// 対応フロー
// ============================================
import type { FlowStage, ResponsePolicy } from "@/types";

export const FLOW_STAGES: FlowStage[] = ["receipt", "policy", "investigation", "completed", "reported"];

export const FLOW_STAGE_LABELS: Record<FlowStage, string> = {
  receipt: "受領確認",
  policy: "方針決定",
  investigation: "事実確認",
  completed: "対応完了",
  reported: "レポート反映",
};

export const FLOW_STAGE_SLA: Record<FlowStage, string> = {
  receipt: "1営業日以内",
  policy: "3営業日以内",
  investigation: "5営業日以内",
  completed: "5営業日以内",
  reported: "月次",
};

/** 段階ごとのSLA日数（計算用） */
export const FLOW_STAGE_SLA_DAYS: Record<FlowStage, number> = {
  receipt: 1,
  policy: 3,
  investigation: 5,
  completed: 5,
  reported: 30,
};

export const RESPONSE_POLICY_LABELS: Record<ResponsePolicy, string> = {
  respond: "対応する",
  observe: "経過観察",
  inform_only: "情報共有のみ",
};

// ============================================
// 管理部署
// ============================================
import type { Department, AdminRole, AdminUser, CategoryAssignment } from "@/types";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  healthcare: "ヘルスケア事業部",
  hr: "人事・労務部",
  management_hq: "経営管理本部",
  general: "総務部",
  audit: "運営監査課",
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  primary_receiver: "一次受信担当",
  dept_owner: "部署担当",
  sub_owner: "副担当",
  admin: "管理者",
};

/** カテゴリごとの担当部署ルール */
export const CATEGORY_ASSIGNMENTS: Record<Category, CategoryAssignment> = {
  safety:       { primary: "healthcare",    related: [] },
  quality:      { primary: "healthcare",    related: [] },
  labor:        { primary: "hr",            related: ["healthcare"] },
  relationship: { primary: "hr",            related: ["healthcare"] },
  policy:       { primary: "management_hq", related: ["healthcare", "general"] },
  other:        { primary: "healthcare",    related: [] },
};

/** モック管理ユーザー一覧 */
export const MOCK_ADMIN_USERS: AdminUser[] = [
  // ヘルスケア事業部
  { id: "admin-1",  name: "田中 美咲", department: "healthcare",    adminRole: "primary_receiver" },
  { id: "admin-2",  name: "佐藤 健一", department: "healthcare",    adminRole: "dept_owner" },
  { id: "admin-3",  name: "中村 あゆみ", department: "healthcare",  adminRole: "sub_owner" },
  { id: "admin-4",  name: "小林 拓也", department: "healthcare",    adminRole: "sub_owner" },
  // 人事・労務部
  { id: "admin-5",  name: "鈴木 裕子", department: "hr",            adminRole: "dept_owner" },
  { id: "admin-6",  name: "伊藤 大輔", department: "hr",            adminRole: "sub_owner" },
  { id: "admin-7",  name: "渡辺 千佳", department: "hr",            adminRole: "primary_receiver" },
  // 経営管理本部
  { id: "admin-8",  name: "高橋 誠",   department: "management_hq", adminRole: "admin" },
  { id: "admin-9",  name: "加藤 真理", department: "management_hq", adminRole: "dept_owner" },
  { id: "admin-10", name: "松本 浩二", department: "management_hq", adminRole: "sub_owner" },
  // 総務部
  { id: "admin-11", name: "山本 直樹", department: "general",       adminRole: "sub_owner" },
  { id: "admin-12", name: "井上 恵",   department: "general",       adminRole: "dept_owner" },
  // 運営監査課
  { id: "admin-13", name: "木村 正人", department: "audit",         adminRole: "admin" },
];

/** 部署ごとの既定担当者（dept_owner を優先） */
export const DEFAULT_DEPT_OWNER: Record<Department, string | null> = (() => {
  const map: Record<string, string | null> = {};
  const depts: Department[] = ["healthcare", "hr", "management_hq", "general", "audit"];
  for (const d of depts) {
    const owner = MOCK_ADMIN_USERS.find((u) => u.department === d && u.adminRole === "dept_owner");
    map[d] = owner?.name ?? null;
  }
  return map as Record<Department, string | null>;
})();
