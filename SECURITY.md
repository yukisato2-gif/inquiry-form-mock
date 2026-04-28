# セキュリティ方針 / 本番化時の必須要件

このドキュメントは、本リポジトリ（**現場の声 受付システムのモック**）を将来本番化する際に必ず満たすべき事故防止要件を定義したものです。

> ⚠️ **本リポジトリはモック実装です。本番運用には使用できません。**
> モック動作の維持を優先するため、以下の要件は **本リポジトリ単独では満たされていません**。
> 本番化フェーズに入る前に、本書のチェックリストを必ず通過させてください。

---

## 1. 本モックの設計境界（明示）

| 領域 | 現モックの実装 |
|------|----------------|
| 認証 | なし（`<select>` でロール切替のみ） |
| データ永続化 | クライアントの localStorage のみ（Zustand persist） |
| API レイヤ | なし（`src/app/api/` 配下に Route Handlers なし） |
| middleware | なし（`middleware.ts` 不在） |
| サーバー側権限制御 | なし |
| 総当たり対策 | なし |

これらは **モックとして意図的に省略**しています。要件確認・画面検証目的に閉じた割り切りです。

---

## 2. 現モックで担保している事故防止項目（参考）

将来本番化する際にも維持すべき設計判断:

- 投稿者画面 `/post/history` で **投稿一覧を表示しない**（[src/app/post/history/page.tsx](src/app/post/history/page.tsx) は静的案内画面）
- 投稿者の状況確認は **確認コード完全一致のみ**（[src/app/post/status/page.tsx](src/app/post/status/page.tsx)）
- 状況確認 URL に `?id=` 等のクエリで投稿が直開きされる経路を **塞いでいる**
- 確認コードは **1コード = 1投稿**、生成時に既存コードと衝突チェック（[src/stores/useAppStore.ts](src/stores/useAppStore.ts) `generateConfirmationCode`）
- `I` / `O` / `1` / `0` を除外した見間違えにくい文字種を使用
- 部分一致・LIKE 検索なし、`toUpperCase()` 正規化後の `===` 比較

---

## 3. 本番化時の必須要件（事故防止チェックリスト）

### 3.1 投稿者側（匿名性の保護）

- [ ] **投稿データを localStorage / sessionStorage / cookie に保存しない**
  - 現モックは Zustand persist で `posts` 配列を localStorage に平文保存している
  - 本番ではサーバー側 DB のみを正とする
- [ ] **サーバー側 API で確認コード照合する**
  - クライアントに全投稿を渡してから絞り込む実装は禁止
  - API は `POST /api/posts/lookup { code }` 形式で、サーバー側で完全一致 1 件のみ返却
- [ ] **端末依存の投稿履歴表示は実装しない**
  - 「自分の過去投稿一覧」のような UI を作らない
- [ ] **確認コードの仕様**
  - 1 コード = 1 投稿（一意）
  - 完全一致のみ（部分一致・LIKE 禁止）
  - 複数ヒット時はエラー扱い（一意性が壊れている＝事故）
- [ ] **総当たり対策**
  - サーバー側で失敗回数を記録し、一定回数（例: 5 回）で一定時間（例: 10 分）ロック
  - レスポンスは存在有無を曖昧にし、コードの存在判定をさせない

### 3.2 管理者側（権限制御）

- [ ] **すべてのデータ取得をサーバー側で制限する**
  - フロント（クライアント JS）だけの制御は禁止
  - クライアント JS は改変自由なため補助にしかならない
- [ ] **役職・所属に基づく閲覧範囲制御**

  | role | 閲覧範囲 |
  |------|----------|
  | `site_user`（拠点ユーザー） | `WHERE post.gh_id = user.gh_id` |
  | `hq_manager`（本社） | `WHERE post.department = user.department` または `user.role_level >= manager` |
  | `admin`（システム管理者） | 全件 |

- [ ] **`role_level` を数値で明示的に管理する**
  - 文字列ロール比較ではなく、`role_level >= 100` のような数値比較で権限判定
- [ ] **API レイヤで強制フィルタを適用する**
  - クエリパラメータで `gh_id` を受け取らない
  - 認証情報（セッション/JWT）から `user.gh_id` を取り出してサーバー側で自動付与
  - 例（NG）: `GET /posts?gh_id=xxx` ← 改ざんで他拠点を見られる
  - 例（OK）: `GET /posts` ← サーバーが認証情報から `gh_id` を強制適用
- [ ] **同一の制御を全経路に適用**
  - 一覧取得 / 詳細取得 / 検索 / CSV 出力 / 直接 API すべて

### 3.3 絶対禁止事項

- [ ] **「取得してから隠す」実装の禁止**
  - 全件をクライアントへ返してから JS で `filter` するのは禁止
  - 権限外データはサーバーから一切返さない
- [ ] **フロントだけの制御の禁止**
  - クライアント側 `if` 文での権限チェックを唯一の防衛線にしない
- [ ] **曖昧検索の禁止**
  - 確認コードに対する LIKE 検索・前方一致検索は禁止
- [ ] **確認コードの複数ヒットを許さない**
  - 一意性制約 (UNIQUE INDEX) を DB レベルで強制
- [ ] **権限外データの一時保持の禁止**
  - サーバーが返してから消す、ではなく、最初から返さない

---

## 4. 本番化フェーズの想定実装

参考メモ（強制ではない）:

| 領域 | 想定実装 |
|------|----------|
| API | Next.js Route Handlers（`src/app/api/...`）または別途バックエンド |
| 永続化 | Vercel Postgres / Supabase / 自社 DB のいずれか |
| 認証 | NextAuth（Credentials/SSO）または自社 SSO |
| 権限制御 | `middleware.ts` でロール検査 + Route Handler 内で `WHERE` 句強制 |
| 総当たり対策 | Vercel KV / Redis でカウンタ管理、Edge Functions でレート制限 |

---

## 5. 関連ファイル（現モックでの該当実装）

| ファイル | 役割 | 本番化で見直すべき点 |
|----------|------|----------------------|
| [src/stores/useAppStore.ts](src/stores/useAppStore.ts) | Zustand persist で全投稿を localStorage 保存 | 永続化をサーバー側 DB に移管 |
| [src/app/post/status/page.tsx](src/app/post/status/page.tsx) | クライアントで全投稿から `find` | サーバー側 API 呼出に置換 |
| [src/app/post/history/page.tsx](src/app/post/history/page.tsx) | 静的案内画面（一覧なし） | 維持 |
| [src/app/admin/reception/page.tsx](src/app/admin/reception/page.tsx) | 全投稿を取得後にフロントでフィルタ | サーバー側で `WHERE` 強制 |
| [src/components/layout/Header.tsx](src/components/layout/Header.tsx) | `<select>` でロール切替（認証なし） | 認証情報からロール取得 |

---

## 6. 改訂履歴

- 2026-04-23: 初版作成。本モックを「事故防止要件の引き継ぎ書」として位置づけ。
