import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Post, Status, Role, Category, Urgency, ExpectedAction,
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

interface AppState {
  posts: Post[];
  currentRole: Role;
  nextId: number;
  currentAdmin: AdminUser;

  addPost: (draft: PostDraft) => string;
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
}

function generateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `V-${code}`;
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

      addPost: (draft) => {
        const id = generateId();
        const now = new Date().toISOString();
        const assignment = CATEGORY_ASSIGNMENTS[draft.category];
        const newPost: Post = {
          id,
          category: draft.category,
          body: draft.body,
          location: draft.location,
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
        return id;
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
