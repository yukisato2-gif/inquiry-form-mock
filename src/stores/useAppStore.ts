import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Post, Status, Role, Category, Urgency, ExpectedAction, LocationArea,
  AdminUser, FlowStage, ResponsePolicy, AssignRecord, ActionLogEntry, FlowRecord,
} from "@/types";
import { mockPosts } from "@/data/mockPosts";
import {
  MOCK_ADMIN_USERS,
  CATEGORY_ASSIGNMENTS,
  FLOW_STAGE_LABELS,
  RESPONSE_POLICY_LABELS,
  DEPARTMENT_LABELS as DEPARTMENT_LABELS_IMPORT,
} from "@/lib/constants";

/** Post に対応履歴を1件追加するヘルパー */
function appendLog(post: Post, entry: Omit<ActionLogEntry, "at">, now: string): ActionLogEntry[] {
  return [...(post.actionLog ?? []), { ...entry, at: now }];
}

/**
 * 復元時に旧データの actionLog / flowHistory が undefined の場合を空配列に正規化する
 */
/** status → flowStage の導出（旧データ補正用） */
function deriveFlowStage(status: Status): FlowStage {
  switch (status) {
    case "RECEIVED": return "receipt";
    case "CONFIRMED": return "policy";
    case "ESCALATED": return "investigation";
    case "NOTED": return "completed";
    default: return "receipt";
  }
}

function normalizePosts(posts: Post[]): Post[] {
  return posts.map((p) => ({
    ...p,
    actionLog: p.actionLog ?? [],
    flowHistory: p.flowHistory ?? [],
    assignHistory: p.assignHistory ?? [],
    flowStage: p.flowStage ?? deriveFlowStage(p.status),
    // localStorage の旧データに新必須フィールドがない場合のフォールバック
    anonymous: p.anonymous ?? true,
    urgency: p.urgency ?? "normal",
    expectedAction: p.expectedAction ?? "unsure",
    hasAttachment: p.hasAttachment ?? false,
  }));
}

interface PostDraft {
  location: string;
  locationArea?: LocationArea;
  anonymous: boolean;
  posterName: string | null;
  jobTitle: string | null;
  category: Category;
  urgency: Urgency;
  body: string;
  occurredAt: string | null;
  isOngoing: boolean;
  expectedAction: ExpectedAction;
  hasAttachment: boolean;
}

/** 期待対応 → 初期方針のマッピング
 *  「状況を知っておいてほしい」のみ自動設定、それ以外は本社側で判断 */
const EXPECTED_TO_POLICY: Record<ExpectedAction, ResponsePolicy | null> = {
  inform: "inform_only",       // 情報共有のみ → 自動設定
  area_improve: null,          // 本社側で判断 → 「選択してください」
  hq_check: null,              // 本社側で判断 → 「選択してください」
  unsure: null,                // 一次受付で判断 → 「選択してください」
};

/** フロー段階 → 投稿者向けステータスへのマッピング */
const FLOW_TO_STATUS: Record<FlowStage, Status> = {
  receipt: "RECEIVED",
  policy: "CONFIRMED",
  investigation: "CONFIRMED",
  completed: "NOTED",
  reported: "NOTED",
};

/** 新規投稿時に発行する識別子セット */
export interface NewPostIdentifiers {
  id: string;               // 内部キー（= 受付番号と同値）
  inquiryNumber: string;    // 受付番号（管理用）
  confirmationCode: string; // 本人確認コード
}

interface AppState {
  posts: Post[];
  currentRole: Role;
  nextId: number;
  currentAdmin: AdminUser;
  /** 拠点管理者（ホーム長）モックで選択中の拠点。null の場合は未選択。
   *  セッション内のみ保持し、永続化はしない（partialize 対象外）。 */
  currentSiteLocation: string | null;

  addPost: (draft: PostDraft) => NewPostIdentifiers;
  advanceStage: (id: string, stage: FlowStage) => void;
  revertStage: (id: string, stage: FlowStage) => void;
  setResponsePolicy: (id: string, policy: ResponsePolicy) => void;
  updatePostStatus: (id: string, status: Status) => void;
  updatePostMemo: (id: string, memo: string) => void;
  updatePublicComment: (id: string, comment: string) => void;
  assignUser: (id: string, userName: string) => void;
  setAssignedDept: (id: string, dept: string) => void;
  resetPosts: () => void;
  setRole: (role: Role) => void;
  setCurrentAdmin: (admin: AdminUser) => void;
  setCurrentSiteLocation: (loc: string | null) => void;
}

/** 見間違えにくい 32 文字（I/O/1/0 を除外） */
const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateId(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return `V-${code}`;
}

/** 本人確認コード（8文字）を重複チェック込みで発行 */
function generateConfirmationCode(existing: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
    }
    if (!existing.has(code)) return code;
  }
  // 32^8 ≈ 1.1兆通り。20回連続衝突は事実上起きないが保険で時刻付加
  return `${Date.now().toString(36).toUpperCase().slice(-4)}XXXX`.slice(0, 8);
}

/** mockPosts のディープコピーを生成（参照汚染を防止） */
function createInitialPosts(): Post[] {
  return JSON.parse(JSON.stringify(mockPosts));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      posts: createInitialPosts(),
      currentRole: "poster" as Role,
      nextId: mockPosts.length + 1,
      currentAdmin: MOCK_ADMIN_USERS[0],
      currentSiteLocation: null,

      addPost: (draft) => {
        const id = generateId();
        const inquiryNumber = id; // 既存 id と同値で保持（管理画面の id 参照を維持）
        const existingCodes = new Set(
          get().posts.map((p) => p.confirmationCode).filter((c): c is string => !!c),
        );
        const confirmationCode = generateConfirmationCode(existingCodes);
        const now = new Date().toISOString();
        const assignment = CATEGORY_ASSIGNMENTS[draft.category];
        const newPost: Post = {
          id,
          inquiryNumber,
          confirmationCode,
          category: draft.category,
          body: draft.body,
          location: draft.location,
          locationArea: draft.locationArea,
          status: "RECEIVED",
          memo: "",
          createdAt: now,
          updatedAt: now,
          anonymous: draft.anonymous,
          posterName: draft.posterName,
          jobTitle: draft.jobTitle,
          urgency: draft.urgency,
          occurredAt: draft.occurredAt,
          isOngoing: draft.isOngoing,
          expectedAction: draft.expectedAction,
          hasAttachment: draft.hasAttachment,
          assignedDept: assignment.primary,
          responsePolicy: EXPECTED_TO_POLICY[draft.expectedAction] ?? undefined,
          flowStage: "receipt",
          actionLog: [],
          flowHistory: [],
          assignHistory: [],
        };
        set((s) => ({
          posts: [newPost, ...s.posts],
          nextId: s.nextId + 1,
        }));
        return { id, inquiryNumber, confirmationCode };
      },

      advanceStage: (id, stage) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        const newStatus = FLOW_TO_STATUS[stage];
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const wasUnassigned = !p.assignedUser;
            const history = p.assignHistory ?? [];
            const newHistory: AssignRecord[] = wasUnassigned
              ? [...history, { at: now, from: null, to: adminName, by: adminName }]
              : history;
            const log = appendLog(p, { by: adminName, action: `「${FLOW_STAGE_LABELS[stage]}」に進めました` }, now);
            const prevStage = p.flowStage ?? "receipt";
            const flowRec: FlowRecord = { at: now, by: adminName, from: prevStage, to: stage };
            return {
              ...p,
              flowStage: stage,
              status: newStatus,
              updatedAt: now,
              assignedUser: p.assignedUser || adminName,
              assignHistory: newHistory,
              actionLog: log,
              flowHistory: [...(p.flowHistory ?? []), flowRec],
            };
          }),
        }));
      },

      revertStage: (id, stage) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        const newStatus = FLOW_TO_STATUS[stage];
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const log = appendLog(p, { by: adminName, action: `「${FLOW_STAGE_LABELS[stage]}」に戻しました` }, now);
            const flowRec: FlowRecord = { at: now, by: adminName, from: p.flowStage ?? "receipt", to: stage };
            return {
              ...p,
              flowStage: stage,
              status: newStatus,
              updatedAt: now,
              actionLog: log,
              flowHistory: [...(p.flowHistory ?? []), flowRec],
            };
          }),
        }));
      },

      setResponsePolicy: (id, policy) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const log = appendLog(p, { by: adminName, action: `方針を「${RESPONSE_POLICY_LABELS[policy]}」に設定` }, now);
            return { ...p, responsePolicy: policy, updatedAt: now, actionLog: log };
          }),
        }));
      },

      updatePostStatus: (id, status) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, status, updatedAt: now, assignedUser: p.assignedUser || adminName }
              : p,
          ),
        }));
      },

      updatePostMemo: (id, memo) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const log = appendLog(p, { by: adminName, action: "対応メモを更新" }, now);
            return { ...p, memo, updatedAt: now, actionLog: log };
          }),
        }));
      },

      updatePublicComment: (id, comment) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const log = appendLog(p, { by: adminName, action: "投稿者への連絡を更新" }, now);
            return { ...p, publicComment: comment, updatedAt: now, actionLog: log };
          }),
        }));
      },

      assignUser: (id, userName) => {
        const now = new Date().toISOString();
        const byName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const prev = p.assignedUser || null;
            if (prev === userName) return p;
            const record: AssignRecord = { at: now, from: prev, to: userName || "(未割当)", by: byName };
            const actionText = prev
              ? `担当者を ${prev} → ${userName || "未割当"} に変更`
              : `${userName} を担当者に設定`;
            const log = appendLog(p, { by: byName, action: actionText }, now);
            return {
              ...p,
              assignedUser: userName || undefined,
              updatedAt: now,
              assignHistory: [...(p.assignHistory ?? []), record],
              actionLog: log,
            };
          }),
        }));
      },

      setAssignedDept: (id, dept) => {
        const now = new Date().toISOString();
        const adminName = get().currentAdmin.name;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const deptTyped = dept as import("@/types").Department;
            const log = appendLog(p, { by: adminName, action: `対応部署を ${DEPARTMENT_LABELS_IMPORT[deptTyped] ?? dept} に変更` }, now);
            return { ...p, assignedDept: deptTyped, updatedAt: now, actionLog: log };
          }),
        }));
      },

      resetPosts: () => {
        localStorage.removeItem("inquiry-form-mock-store");
        set({ posts: createInitialPosts(), nextId: mockPosts.length + 1 });
      },
      setRole: (role) => set({ currentRole: role }),
      setCurrentAdmin: (admin) => set({ currentAdmin: admin }),
      setCurrentSiteLocation: (loc) => set({ currentSiteLocation: loc }),
    }),
    {
      name: "inquiry-form-mock-store",
      // posts と nextId のみ永続化。currentRole / currentAdmin はセッション内のみ。
      partialize: (state) => ({
        posts: state.posts,
        nextId: state.nextId,
        currentAdmin: state.currentAdmin,
      }),
      // 復元時に actionLog / flowHistory / assignHistory を正規化
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>;
        return {
          ...current,
          posts: p.posts ? normalizePosts(p.posts) : current.posts,
          nextId: p.nextId ?? current.nextId,
          currentAdmin: p.currentAdmin ?? current.currentAdmin,
        };
      },
    },
  ),
);
