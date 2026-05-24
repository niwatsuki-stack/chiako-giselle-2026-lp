# LP 作業引き継ぎメモ(2026-05-23 セッション 終了時点 / 約 2,634 行)

> このフォルダで LP の作り込みを継続します。新 session に最初に読ませてください。

---

## 🆕 2026-05-23 セッションの作業履歴(構造再編 + Firebase 連動 + 公開)

### Phase 2-4 構造再編(LP の冗長性を一気に解消)
- **Phase 2: Story Act I + II 統合** — 2 セクション → 1 セクション(`id="story"`)。
  - 冒頭にセクション全体ヘッダー「STORY — 物語 / amour, mort, et pardon」
  - Act I(左寄せ・黄昏 act-bg-1)→ 細い金線ディバイダ →  Act II(右寄せ・夜 act-bg-2)で対比
  - 各幕 `py-24 md:py-32` に縮小、全体で約 30% コンパクト化
- **Phase 3: First Time + FAQ 統合** — 2 セクション → 1 セクション(`id="faq"`)。
  - 上: 「— FIRST TIME ? —」 + **4 ヒント横並びカード**(服装/マナー/所要時間/予習)
  - 下: 「— FAQ —」 + アコーディオン 6 件
  - 縦の長さ約 40% 減
- **Phase 4: Testimonials 6 → 3 件 厳選** — 異なる層 1 件ずつ:
  - M.K.(40代/初観劇/2024 白鳥)/ A.S.(20代/YouTube → 初観劇/2025 ドンキ)/ N.Y.(30代/観劇10年/2024 白鳥)
  - 削除: H.T.(親子)/ R.O.(再開)/ T.M.(家族)
  - **各声に「観劇公演」追加**(信頼度UP、`serif-en text-[10px] color: gold`)
  - grid 2列 → 3列にレイアウト変更

### Hall Map(座席表)リファイン
- **面積比を実数準拠**: S 757 / A 351 / B 78 → A は控えめ、B は明らかに小さい列に
- **STAGE をプロセニアム風アーチ**(linear-gradient + spotlight 楕円)
- **S 席を末広がり扇形**(SVG path で観客側に広がる)
- **凡例追加**(■ S席・757 / ■ A席・351 / ■ B席・78、各色チップ付き)
- **STAGE / S / A / B の説明文を統一**(右下に小さく)
- viewBox 400×300 → 400×340 に拡張、max-w-xl 制限で読みやすさUP

### Hero タイトル系
- **Loader を完全廃止**(月夜の森・ヴェール・インク満ち等 全て試したが「ちゃっち感 + 浮く」問題が解消できず → Apple/Hermès 流儀で潔く削除)
- **Hero タイトル letter-by-letter は復活**(loader 無い今、LP の幕開けを担う)
- **#shorts 位置修正**: `bottom: -10%` → **`top: 100%; translateY(-30%) rotate(-5deg)`** で GISELLE 本文との被り解消(タイトル下端と #shorts 上端だけ意図的に少し重なる)

### Tickets/CTA
- **Tickets カード相互作用追加**: A 席 hover で他カードが opacity-0.7 で薄くなり主役感(`.tickets-grid` CSS)
- **過去公演 CTA 重複バグ削除**(2 つあった archive.html リンクを 1 本に整理)
- **ヘッダーに「過去公演」リンク追加**(出演者/声/過去公演/チケット)

### sticky countdown bar 軽量化
- `top-[68px] md:top-[72px]` → `top-16`
- `py-4 md:py-5` → `py-2.5 md:py-3`
- フォントサイズ全体縮小(text-2xl → text-xl 等)で圧迫感解消

### アクセシビリティ
- **`prefers-reduced-motion: reduce`** メディアクエリ対応(全 animation/transition を 0.01ms に、 cursor-particle / vili-shape / bubble 非表示)
- **JS でも `matchMedia('(prefers-reduced-motion: reduce)')` チェック**(粒子生成 skip)
- **FAQ + 回転に `transition-transform duration-300 inline-block`** 追加(6 ヶ所、瞬間切替 → 滑らかに)

### 🔥 Firebase Realtime DB セットアップ + ♡ 推しカウント機能
- **Firebase プロジェクト作成**: `chiako-oshi-2026`(confy.co.jp 親、 Spark プラン無料)
- **Realtime Database**: `asia-southeast1`(シンガポール)、 テストモード(2026/6/22 まで誰でも書き込み可)
- **Web アプリ登録**: `giselle-lp`、 config 取得済(下記参照)
- **LP に Firebase SDK CDN 追加**(`<script type="module">` で modular v10.13.2)
- **♡ クリック動作**: LocalStorage に保存 + Firebase RTDB `castVotes/{name}` を `runTransaction` で increment/decrement(匿名集計)
- **数字バッジ**: 各 Cast portrait の ♡ 左隣に全体カウント表示(`onValue` でリアルタイム更新)
- **管理画面**: URL に `#admin-chiako` を付けると左下に「♡ OSHI RANKING (live)」 + 総票数表示
  - 完璧なセキュリティではない(JS で `ADMIN_KEY` 見える)が、 知らない人は触れない
- **♡ ボタン位置**: `bottom: 14%; right: 14%; width: 32px; height: 32px;` 固定(SP 用 12% / 30px)で円形クリッピング内に確実に収まる

### 公開 (Netlify Drop)
- **公開済 URL**: https://coruscating-alfajores-abfb22.netlify.app/(本田さん共有用、 ※後でパスワード保護が掛かった模様)
- ファイルサイズ削減: audio/giselle-bgm.mp3.before_denoise(46MB) + old_irving(23MB) を `バレエ公演/_audio_backup/` に退避 → 132MB → 60MB に
- **未完了**: 最新の修正(Hero #shorts 位置、 ♡ 位置調整)はまだ反映されてない。 Netlify Drop の制限で再 deploy できず → 次回 Netlify アカウント claim or 別サービス必要

### Firebase Config(次セッションが参照可能)
```js
const firebaseConfig = {
  apiKey: "AIzaSyCAT4eDtAkp8eoOPwoRq6sdz-g6ciFWgvs",
  authDomain: "chiako-oshi-2026.firebaseapp.com",
  databaseURL: "https://chiako-oshi-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chiako-oshi-2026",
  storageBucket: "chiako-oshi-2026.firebasestorage.app",
  messagingSenderId: "948733958615",
  appId: "1:948733958615:web:cb4a58d2d3912455ad1392"
};
```
LP の `<head>` 末尾に `<script type="module">` で組み込み済。

---

## ⏭ 次回 セッション 最優先タスク

1. **Netlify アカウント claim + 既存サイト再 deploy**(本田さんに最新版見せる)
   - https://app.netlify.com/ → Log in with Google(Ballet Studio アカウント)
   - 既存 `coruscating-alfajores-abfb22` を claim
   - 「Deploys」 → ドラッグで再 deploy(60MB の lp フォルダ)
2. **iPhone で再確認**: Hero #shorts 位置、 ♡ ハート位置(円内に収まる)、 ♡ カウントバッジ
3. **Firebase RTDB ルール更新**: 現状 `now < 1782054000000`(2026/6/22)→ 公演 7/30 までに延長 or 認証導入
4. **本田さんからのフィードバック反映**(LINE で送る前提なので回収待ち)

---

## 🚧 ペンディング(本田さん側 / ユーザー側タスク)

- 11 名所属 確認返信(森田 エストニア、 中野 シビウ劇場、 山本 新国立、 鈴木賢陽 チェコ国立 など)
- 主宰の言葉(本田 portrait + メッセージ)
- 鈴木賢陽 プロフィール詳細
- 過去公演動画の Members Only 仕様確認(古川さん相談)
- 公式 LINE / Insta / X リンク差し替え(現状 placeholder)

---

## このフォルダで作業すること

**「ちあこと愉快な仲間達 2026 GISELLE」公演 LP**(2026/7/30 めぐろパーシモンホール)の作り込み。

メインファイル: `index.html`(現在 **約 2,164 行**、HTML + Tailwind CDN、1 ファイル完結)。

> ⚠️ **デプロイ状況訂正**: 「Vercel/Netlify で公開済の想定」は誤情報、**実態はローカル開発のみ**(file:// で確認中)。 デプロイは「LP 作り込み一段落してから」と判断、今は機能拡充優先。

---

## 2026-05-21 セッション 3 の作業履歴(CMO 視点でのコンテンツ充実)

### 新規追加セクション(計 6 個)
1. **Sticky Countdown Bar**(Hero 直下、 ヘッダー下に貼り付き続ける)
   - `à 70 jours · 公演まで あと 70 日`(JS 動的計算)
2. **HIGHLIGHTS — 公演の見どころ 5 つ**(Story Act II → ココ → Relations)
   - 01 狂乱の場(森田) / 02 パドドゥ(森田 × 福岡) / 03 ウィリの群舞 / 04 ミルタの威厳(渡辺) / 05 許しと愛
3. **PAST PERFORMANCES — 過去公演アーカイブ**(Testimonials → ココ → Video)
   - 4 動画 grid(2023 ドンキ大阪 / 2024 白鳥 東京 / 2025 ドンキ東京 / 2025 くるみ大阪)
   - **iframe ではなく `<a>` + `<img>` 方式**(YT メンバー限定動画は iframe で TV アイコン化するため)
   - サムネは `lp/images/thumbnails/` の PNG、クリックで YT へ、ロック画面でメンバー登録誘導
   - メンバーシップ CTA カード(rouge gradient、`YouTube membership URL`)
4. **FOR YOU — 3 ターゲット分岐**(Video → ココ → Tickets、 戦術 2 ベース)
   - 01 ちあこファン → **S 席** / 02 初心者 → **A 席(RECOMMENDED 太枠)** / 03 友達・家族 → **B 席**
   - A 席集中は中央のみ、 全席種が活きる UX
5. **FAQ**(First Time? → ココ → Access)
   - 6 質問(初心者 / 子連れ / 車椅子 / キャンセル / 撮影 / 当日券)`<details>/<summary>` でアコーディオン(JS 不要)
6. **A MESSAGE FROM CHIAKO — 主宰の言葉**(Sponsors → ココ → Final CTA)
   - 本田 portrait + メッセージカード(プレースホルダー、 本田からの直筆 / 動画 待ち)
7. **SHARE**(Final CTA → ココ → Footer)
   - X / LINE / Facebook / URL コピー の 4 ボタン
   - JS で `window.location.href` から動的取得 → ドメイン気にせず動作

### 既存セクション改修
- **Cast**: プロ 11 名の所属表記追加(Principal は詳しめ 2 行、 Ensemble は 1 行)
   - 鈴木賢陽 のみ 「— プロフィール準備中 —」(本人待ち)
- **Testimonials**: 「狂乱の場」「ウィリの群舞」削除 → 「群舞の美しさ」「主演ダンサーのソロ」に(ジゼル特有用語の矛盾解消)
- **Past Performances**: MEMBERS ONLY badge 削除(サムネ画像内に既にあるため二重)
- **Past Performances**: 漢字場所表記「大阪公演」「東京公演」削除 → 英文「· Osaka」「· Tokyo」に集約
- **OGP meta tag 拡張**: og:image(`images/og-image.png`、1200×630)、og:image:width/height、og:type=event、og:locale=ja_JP、Twitter Card(`summary_large_image`)
- **About**: 「プロのバレエダンサー 11 名」→ 「一線級で活躍するプロバレリーナ 11 名」(strong 強化、 一段格上げ)
- **Sticky Bar 拡張**: countdown + SHARE x 3(desktop 限定)
- **本田肩書**: 「ちあこちゃんねる 主宰」 → 「ちあこちゃんねる」(2 箇所、ダサい指摘)
- **「Chiako HONDA」**: 「Chiaki HONDA」に修正(英表記揺れ修正)
- **Footer**: 「PRESENTED BY 株式会社 CONFY」だけにシンプル化(代表取締役名・住所削除)

### 副産物(`告知素材/` 配下)
- `サムネモックアップ_v1.html` — デザイン仕様書 + タイトル統一案 + 5 サムネ プレビュー
- `サムネ_v1/styles.css + thumb_XX.html + thumb_XX.png` — Chrome headless で 5 PNG(1280×720)生成
- `サムネ_v1/svg/thumb_XX.svg` — Figma import 用 SVG 5 ファイル
- `og_image_v1/og.html + og-image.png` — OGP 用 HTML + 1200×630 PNG
- `lp/images/thumbnails/` — LP 用サムネ PNG 4 枚
- `lp/images/og-image.png` — OGP 画像

### 関連ファイル
- ユーザーが LINE で 11 名(プロ 11 名)に **所属確認テンプレ** 送信済 → 返信待ち
- YT 側 動画タイトル + サムネ更新済(ユーザー実施)

### セッション 3 後半 — シリーズ化(Phase 1+2+3)

ユーザーの「LP もシリーズとして引き継ぎたい」要望に応えて、シリーズ全体の設計をスタート:

1. **[`SERIES-DESIGN.md`](../SERIES-DESIGN.md)** 新規作成(事業/バレエ公演/ 配下)
   - シリーズ全体設計書、 公演履歴、 ファイル構成、 命名規則、 データ構造案(JSON schema)、 Phase 1-4 段階定義、 デザイン資産、 引き継ぎ運用ルール、 次回公演チェックリスト
   - **2027 公演前に Phase 3(JSON テンプレ化)に移行できる準備完了**

2. **[`lp/archive.html`](./archive.html)** 新規作成(過去公演アーカイブ独立ページ)
   - 過去 4 公演(2023 ドンキ大阪 / 2024 白鳥 東京 / 2025 ドンキ東京 / 2025 くるみ大阪)
   - 各公演ブロックに 動画 + 写真 grid(6 枚 placeholder)
   - 演目別カラーテーマ(`theme-donq-bg` / `theme-swan-bg` / `theme-nut-bg`)
   - 末尾: メンバーシップ CTA + 現公演 LP への誘導

3. **LP の Past Performances に archive.html リンク追加**
   - 「過去公演アーカイブをすべて見る →」 ボタン(動画 grid 直下)

4. **画像 dir 構造作成**(命名規則確立)
   ```
   lp/images/archives/
   ├── 2023-don-quixote/
   ├── 2024-swan-lake/
   ├── 2025-don-quixote-tokyo/
   └── 2025-nutcracker-osaka/
   ```
   ※ 中身は空、 ユーザーが各公演ベスト写真 6 枚ずつ配置予定

### 過去公演写真 — 進捗(2026-05-23 更新)

| 公演 | 写真 | 場所 |
|------|------|------|
| 2023 ドン・キホーテ 大阪(8/5) | ✅ **6 枚配置済**(8→6 CCO 選定、 残 2 枚 extras 保管) | `lp/images/archives/2023-don-quixote-osaka/photo01-06.jpg` |
| 2024 白鳥の湖 東京(8/6) | ✅ **6 枚配置済**(© KURUMI PHOTO) | `lp/images/archives/2024-swan-lake-tokyo/photo01-06.jpg` |
| 2025 ドン・キホーテ 東京(8/7) | ✅ **6 枚配置済** | `lp/images/archives/2025-don-quixote-tokyo/photo01-06.jpg` |
| 2025 くるみ割り人形 大阪(8/2) | ❌ **写真なし(本田確認済)** | placeholder のまま放置 |

#### 本田選定の経緯(2026-05-23)
- gigafile 2 件で写真送付:
  - `gigafile-0830-b09a***`(6 枚、 20***.JPG) → 2024 白鳥東京
  - `gigafile-0830-fe09***`(8 枚、 0805_***.JPG) → 2023 ドンキ大阪
- CCO 判断で 2023 ドンキ 8→6 に絞り込み(統一感優先)
- 除外 2 枚は `2023-don-quixote-osaka/extras/` に保管(再利用用)
  - `photo_excluded_yellow_tutu.jpg`(黄チュチュ + 赤チェック男)
  - `photo_excluded_group_shot.jpg`(全員集合写真、 楽屋っぽさ)
- archive.html 反映済(2023 + 2024 = 12 枚分の placeholder → 実画像 + alt 設定)

#### 2025 くるみ大阪 写真について(2026-05-23 セッション 4 最終)
- 本田から「写真なし」と確認
- 動画原本(MXF 76GB)は Dropbox `動画素材/公演2025/大阪公演/` に存在
- ffmpeg で 14 サンプル切り出し検証 → **CCO 判断で取り止め**:
  - 動画用照明(絞り気味)+ ロングショット主体 + 動きブレ → プロ撮影写真と並べると **2025 くるみだけ品位低い**
  - 「3 年後見て恥ずかしくないか」 の CCO 基準で NG
- archive.html で **photo grid 削除** → 動画 iframe 単独 + 「公演本編は メンバーシップでお楽しみください」 メッセージに変更
- 結果: スッキリ + 誠実な訴求、 メンバーシップ動線も維持

#### ffmpeg について
- `~/bin/ffmpeg`(static binary、 evermeet.cx から取得、 26MB)残置
- 将来動画作業(切り出し / 結合 / 形式変換)で再利用可能

---

## 2026-05-23 セッション 4 末 — 全体 UX 改善(archive.html)

### 写真ライトボックス導入
- 旧: 写真クリック → `target="_blank"` で 別タブ + 画像 raw 表示(離脱)
- 新: 写真クリック → **サイト内 modal(lightbox)で 1200px 拡大**
- 操作: 矢印キー(前/次)、Esc(閉じる)、 背景クリック(閉じる)
- 18 枚 全部対応(2023 + 2024 + 2025 ドンキ)

### サムネ軽量化
- `archives/{公演}/thumbs/thumb01-06.jpg`(400px、 平均 33KB)生成
- grid 表示 = thumbs(合計 **588 KB**)、 拡大時 = photo01-06.jpg(1200px、 合計 4.4 MB)
- ページ読込: **5.4MB → 0.6MB**(86% 削減)

### index → archive 導線追加
- Past Performances セクション、 メンバーシップ CTA の前に「**全アーカイブを観る →**」ボタン
- archive.html へリンク、 サイト内回遊

### archive Footer 統一
- 旧: 中央 1 列「PRESENTED BY 株式会社 CONFY」
- 新: **3 列**(Presented By / Inquiry / Membership)+ © + ブランド mark(index.html と統一感)

### archive Hero 装飾追加
- LP の Hero と同じ `.bubble` decorative shape 3 個 配置
- 世界観統一

---

## 2026-05-23 セッション 4 最終 — LP セクション順序見直し Phase 1

### Tickets + FOR YOU を About 直後に移動
- 旧: Tickets が 14 番目(スクロールしないと出てこない)
- 新: **Tickets が 6 番目**(Hero 数スクロール後で見える)
- 動線: Hero(いつ・どこ)→ About(何・誰)→ FOR YOU + Tickets(**いくら / 選び方**)→ Story → ...
- CMO 期待: コンバージョン UX 劇改善、 「価格高い?」を早く解消

### Phase 1.5: FOR YOU + Tickets 統合(2026-05-23)
- 旧: FOR YOU(3 ターゲット分岐)+ Tickets(3 席種)で 同じ 3 セグメント が 2 セクション分散
- 新: **Tickets 各カードに「こんな方へ」を組み込み**(タイプ × 席 × 価格 × 購入 を 1 カード完結)
  - S 席: pour les fans / ちあこちゃんねるファンへ
  - A 席: pour les débutants / ジゼル初体験の方へ(RECOMMENDED)
  - B 席: à deux ou plus / お友達・家族と一緒に
- セクション数: 22 → 21、 冗長解消

### 残 Phase(セッション 5 以降)
- Phase 2: Story Act I + II 統合(2 セクション → 1 アシンメトリー)
- Phase 3: First Time? + FAQ 統合
- Phase 4: Testimonials 6 件 → 3 件 短縮

---

## 2026-05-23 セッション 4 最終 — 所属確定 + PDF 確認 + 自発チェック

### 確定 所属(11 名)

| 役 | 名前 | 所属 |
|----|------|------|
| ペザント / ドゥ・ウィリ | 本田 千晃 | ちあこちゃんねる |
| アルブレヒト | 福岡 雄大 | 新国立劇場バレエ団 |
| ジゼル | 森田 愛海 | **エストニア国立バレエ団** |
| ミルタ | 渡辺 与布 | アメリカン・バレエ・シアター |
| バチルダ | 奥野 凜 | ルーマニア国立バレエ団 |
| ヒラリオン | 上中 佑樹 | 新国立劇場バレエ団 |
| ペザント | 鈴木 賢陽 | **チェコ国立バレエ団** |
| フレンズ | 内藤 亜仁 | 元 イスタンブール国立バレエ団 |
| フレンズ/ドゥ・ウィリ | 中野 伶美 | **元 シビウ劇場バレエ団** |
| フレンズ | 東野 瑞生 | スターダンサーズ・バレエ団 |
| フレンズ | 山本 怜 | **新国立劇場バレエ団** |

### PDF 確認 → 席種訂正(`販売不可席図面_0202.pdf`)

| 席 | 旧 LP 表記 | 新(正確) |
|----|----------|---------|
| S(757 席)| 1 階前方〜中盤 | **1 階席のほぼ全エリア** |
| A(351 席)| 1 階後方〜2 階バルコニー | **2 階バルコニー前方** |
| B(78 席)| 3 階席、 オーケストラピット含む、 舞台全体を俯瞰 | **2 階最後方 希少 78 席**、 静かに俯瞰 |

### Tickets ターゲット 最終調整
- S: pour les fans / ちあこちゃんねるファンへ
- A: pour les débutants / ジゼル初体験の方へ(RECOMMENDED)
- B: **pour les puristes / バレエ通の方へ**(俯瞰軸、 78 席「お友達・家族と」 から変更)

### About コピー強化
- 旧: 国内外で 一線級で活躍するプロバレリーナ 11 名
- 新: **国内外の一線級で活躍するプロバレリーナ 11 名**(国際性 ABT/エストニア/ルーマニア/チェコ も含む布陣を活かす)

---

## 2026-05-23 セッション 4 ワクワク仕掛け実装(全 6 件)

| # | 仕掛け | 実装 |
|---|--------|------|
| 1 | 🎭 劇場の幕オープン ローディング | curtain-load DOM + 1.3s 開く + 2.4s で fade-out(paper 背景でスムーズ繋ぎ)|
| 2 | ✨ Hero GISELLE 1 文字ずつ登場 | `.giselle-title .letter` 7 個に分割、 nth-child で時差アニメ |
| 3 | 🌟 Hero sparkle 8 粒子 | JS で 8 個 sparkle div を生成、 swirl アニメ |
| 4 | 🕸️ 相関図 SVG path drawing | sed で全 path に class="draw-path"、 reveal.in 時 stroke-dashoffset 0 へ 2.5s |
| 5 | 🌸 マウス追従光粒子 | mousemove(70ms throttle)で cursor-particle 生成、 1.3s で fade |
| 6 | 🎴 Principal hover で役柄解説 | `.principal-portrait` class + role-overlay div、 hover で opacity |
| 7 | 🎵 BGM トグル + 音源配置 | `lp/audio/giselle-bgm.mp3`(アダン「ジゼル」 Act 2 Wilis/PDD/Final、 archive.org PD 録音 Robert Irving 指揮、 23MB)+ 右下 floating button + wave animation |

### ローディング細部修正
- 旧: curtain 背景 `#1A0A0A` で カーテン開いた時に 中央余白が黒く見える
- 新: `var(--paper)` 背景 + opacity fade-out(2.4s で trans 0)で body 色と スムーズ繋ぎ

### BGM 音源クレジット
- Adolphe Adam: Giselle Act II(Wilis / Meeting / Pas de Deux / Final Scene)
- 指揮: Robert Irving、 1950 年代録音、 [Internet Archive PD](https://archive.org/details/lp_adam-ballet-music-from-giselle_adolphe-c-adam-robert-irving)
- LP の volume = 0.25(控えめ)

### バックアップ
- `/tmp/index.html.bak.173425`(Phase 1 実行前)、 問題あればロールバック可

---

## 2026-05-23 セッション 4 末の状態(LP 関連の追加情報)

### 2025 ドンキ東京 写真 — 本田選定 反映完了(2026-05-23 セッション 4 末)

| 元 ID | 配置先 | 内容 |
|-------|--------|------|
| 0807_001024 | photo01 | キトリ ジャンプ(第 1 幕 街) |
| 0807_001320 | photo02 | バジル + 街娘 2 名(第 1 幕) |
| 0807_001711 | photo03 | バジル 大ジャンプ(ヴァリエーション) |
| 0807_002136 | photo04 | ドリアード群舞 + 倒れたドン・キホーテ(第 2 幕 夢の場) |
| 0807_002290 | photo05 | パ・ド・ドゥ(白シフォン) |
| 0807_002740 | photo06 | カーテンコール(金色紙吹雪) |

**選定経緯**:
- 当初: 撮影順機械選定(0807_001001〜0807_001029)を仮配置
- 本田選定: gigafile 経由で 8 枚送付
- CCO 8→6 絞り込み(2023 ドンキと同じ流れ):
  - 除外 0807_002256(グランドフィナーレ)→ photo06 カーテンコールと重複
  - 除外 0807_002532(女性ソロ アラベスク)→ photo05 静かなシーンと重複
- 旧機械選定 6 枚 + 除外 2 枚は `extras/` に保管
- 元データ 421 枚は **共有ドライブ** に移動済(マイドライブ NG メタルール対応):
  - `共有ドライブ/株式会社CONFY/05_公演事業/99_終了公演/250807_ドン・キホーテ_東京/本番写真_422枚/`

### メタルール v1.0 適用(2026-05-23 認識)
共有ドライブ メタルール:
- **新規ファイルは必ず共有ドライブ配下に保存**(マイドライブ NG)
- Slack 送信は `slack_send_message` MCP **禁止**、 **Webhook URL + Python urllib で POST**
- 名義: 公演事業関連は **「公演事業部」**(響諒さん個人名義 NG)
- 不可逆操作(削除・移動・リネーム)は必ず承認後実行

### 残課題(セッション 5 以降)
- 本田から 2025 ドンキ 6 枚返信 → リネーム + archive.html 反映
- Webhook URL の取得 + 仕組み把握(次回 Slack 送信時)
- 個人 Drive(`_移行前アーカイブ_2026Q2/02_公演/`)の他公演 folder も将来 共有ドライブへ整理検討

#### 2025 ドンキ東京 写真ソース
- 元データ: `~/Downloads/0807_本番/`(422 枚プロ撮影、 SONY α7 IV、 Capture One 編集済)
- 加工: `sips -Z 1200 -s format jpeg --setProperty formatOptions 85` で 1200px 縮小、 150-300KB
- archive.html では `<a>` + `<img>` で配置、 クリックで原寸別タブ、 hover で scale 1.05

#### 本田千晃に写真選定依頼(Slack 送信済)
- 各公演 6 枚ずつ選定をお願い、 選定基準 6 個(オープニング/主役ソロ/男性ソロ/ストーリー/ヴァリ/フィナーレ)
- メッセージ: [Slack link](https://confy-hq.slack.com/archives/D0B1TFJ56J1/p1779353506044789)
- 返信届いたら 同手順で残 3 公演分を archive.html に配置

### 動画 A#0 スケジュール変更(2026-05-21 更新)

| 項目 | 旧 | 新 |
|------|---|---|
| 撮影日 | 不明 | **5/31(土)プロカメラマン来訪** |
| 公開予定 | 5/29(木) | **6/1-3 頃(編集後)** |

戦略書 v2 W1 タイムラインから数日遅延。 重大影響なし、 公開後 Video セクション iframe を埋め込み。

---

## 2026-05-20 セッション 2 の作業履歴

1. **写真差し替え 5 名**: `~/Downloads/2026年ジゼル出演ダンサー/` の漢字名ファイルから
   - 山本怜・奥野凜・本田千晃・森田愛海(.png に変更)・渡辺与布
2. **写真 object-position 個別調整**:
   - 森田 (Principal): `transform: scale(1.15)` + `object-position: center 40%`
   - 森田 (円形): `transform: scale(1.15)` + `object-position: center 40%`
   - 東野: `object-position: center 8%`
3. **相関図 SVG 徹底検証・修正**(viewBox 1200×900 座標で全 path × 全円 × 全 label の交差を計算):
   - 9 path の端点を円フチ 5px 外に微調整(円内めり込み解消)
   - ジゼル↔アルブレヒト 上弧の端点を円フチに合わせ
   - ヒラリオン→アルブレヒト 大弧の高さ調整(`y=-10` → `y=35`)
   - アルブレヒト→バチルダ の矢印先端をバチルダ円に届くよう調整
   - **ジゼル→ペザント** path 開始 `y=275 → 355`(ジゼル名前 text 下から開始)
   - **ミルタ→ドゥウィリ「配下」** を弧化(`M 985 555 C 920 600, 920 660, 985 700`)、label を container 左外へ
   - **「愛で守る」(2幕)** path を name text の真上から外す(`M 473 256 C 560 400, 640 400, 667 260`)
   - ミルタの「— ウィリの女王 —」キャプション削除(配下 label との被り解消)
4. **ヘッダーに #shorts** 筆記体ロゴ追加(Italianno、rouge色、-4°回転)
5. **「ウィリ」→「ウィリ」全置換**(17 箇所、登場箇所すべて統一)
6. **鈴木絵美里 LP から削除**(Ensemble 12→11、画像ファイルも削除)
7. **「あらすじ」セクション削除**(Synopsis 130 行 + nav リンク削除、物語/Story と内容重複のため)
8. **About コピー変更**:
   - 「プロのバレエダンサー 11 名」→ 「**一線級で活躍するプロバレリーナ 11 名**」
   - 大見出し「プロ 11 名」→ 「プロバレリーナ 11 名」
   - Final CTA も「プロバレリーナ」に統一
   - 「11」baseline 微調整(`transform: translateY(-0.08em)`)
9. **Testimonials ジゼル特有用語の矛盾解消**:
   - Testimonial 1: 「ウィリの群舞」→ 「群舞の美しさ」
   - Testimonial 4: 「狂乱の場、苦しくて」→ 「主演ダンサーのソロ、心を揺さぶられて」
   - 理由: 今回ジゼル初公演のため、過去公演の声でジゼル固有語句は矛盾
10. **本田写真の試行錯誤**(最終的に個別 CSS 削除):
    - 顔が image 上半分にある構図(3648×3648 正方形)→ CSS では「frame 下方表示」に限界
    - scale 1.2 で頭切れ → デフォルト(`object-position: 25%`、scale なし)に戻す
    - **要検討: 顔中央構図の宣材への差し替え**

---

## 現在の完成状況(2026-05-20 時点)

### 完成しているセクション(セッション 3 終了時点)

1. **Header**(スティッキー、`2026 GISELLE #shorts` 筆記体ロゴ、ナビ:作品 / 物語 / 相関図 / 出演者 / 声 / チケット)
2. **Hero**(GISELLE タイポ + #shorts + 日時会場、淡シアン基調 + フローラル装飾)
3. **🆕 Sticky Countdown Bar**(Hero 直下、`à XX jours` + SHARE x 3 desktop)
4. **About**(**プロバレリーナ 11 + コール・ド** の二層構造、WHY #SHORTS カード、Layer 01 / 02)
5. **Story Act I**(村のジゼル、暖色)
6. **Story Act II**(ウィリの森、青冷色)
7. **🆕 HIGHLIGHTS**(公演の見どころ 5 つ、 番号付き asymmetric)
8. **Relations**(相関図、SVG arrows + 円形ポートレート、被りなし検証済)
9. **Cast**(Principal 2 + Full Cast 表 + Ensemble 11 名、**🆕 各人の所属表記追加**)
10. **Testimonials**(お客様の声 6 件、 ジゼル特有語句なし)
11. **🆕 Past Performances**(過去公演 4 動画 grid、 サムネ画像 + YT リンク方式、 メンバーシップ CTA)
12. **Video**(A#0 プレースホルダー、 5/29 公開後埋め込み予定)
13. **🆕 FOR YOU**(3 ターゲット分岐 → S/A/B、 A 席は RECOMMENDED 強調)
14. **Tickets**(S/A/B 席、A 席を「RECOMMENDED」で強調)
15. **First Time?**(初心者ガイド 4 項目、筆記体 01-04 で番号)
16. **🆕 FAQ**(6 質問アコーディオン、JS 不要)
17. **Access**(めぐろパーシモンホール、Google Maps プレースホルダー)
18. **Sponsors**(MAKERS、Naturecan、ロゴ画像待ち)
19. **🆕 A MESSAGE FROM CHIAKO**(主宰の言葉、 本田 portrait + プレースホルダー)
20. **Final CTA**(青冷色、à bientôt)
21. **🆕 SHARE**(X / LINE / Facebook / URL コピー、 JS 動的 URL)
22. **Footer**(PRESENTED BY 株式会社 CONFY のみ、 簡素化)

### 写真状況(`images/cast/` 配下、**11 名分配置済**)

- `honda_chiaki.jpg`(本田千晃) ← **顔差し替え検討**(現在 image 顔上半分構図、CSS で frame 下方表示に限界)
- `fukuoka_yudai.jpg`(福岡雄大、アルブレヒト役)
- `morita_manami.png`(森田愛海、ジゼル役)← Principal、2026/5/20 漢字名ファイルから差し替え、`scale(1.15)` + `object-position: center 40%`
- `watanabe_atau.jpg`(渡辺与布、ミルタ役)← 2026/5/20 公開済
- `okuno_rin.jpg`(奥野凜、バチルダ役)← 2026/5/20 漢字名ファイル
- `kaminaka_yuki.jpg`(上中佑樹、ヒラリオン役)
- ~~suzuki_emiri.jpg~~ → **削除済**(LP から鈴木絵美里を除外)
- `suzuki_kenyo.jpg`(鈴木賢陽、ペザント)
- `naito_ahito.jpg`(内藤亜仁、ファイル名は ahito だが英表記は **Ami Naito**)
- `nakano_remi.jpg`(中野伶美、ドゥウィリ・フレンズ)
- `higashino_mizuki.jpg`(東野瑞生、フレンズ)← `object-position: center 8%`(引き構図)
- `yamamoto_rei.jpg`(山本怜、フレンズ)← 2026/5/20 漢字名ファイル

### `<style>` 末尾の個別 object-position 設定

```css
.portrait-frame img[src*="morita_manami"] {
  object-position: center 40%;
  transform: scale(1.15);
}
.portrait-frame:hover img[src*="morita_manami"] { transform: scale(1.2); }
.frame-cinema img[src*="morita_manami"] {
  object-position: center 48%;
  transform: scale(1.1);
}
.portrait-frame img[src*="higashino_mizuki"] { object-position: center 8%; }
```

---

## デザイン方針(ユーザー指示)

### 大事にする世界観
- **ポスター直系**: 淡シアン青、白い GISELLE タイポ、フローラル装飾
- **儚い・優雅・幻想的**(ジゼル / ウィリの世界観)
- **本格性 × 親しみやすさ**(ちあこちゃんねるブランド)

### NG / 避けるべきこと
- ❌ **四角だらけ・AI 感**(ユーザー明示指示)
- ❌ 矢印・テキスト・画像の被り(相関図で指摘あり)
- ❌ 同じ形・同じレイアウトの単純反復
- ❌ ボタンが角ばってる

### OK / 積極的に取り入れる
- ✅ **アシンメトリー**(カラム配置のズレ、上下高さ違い)
- ✅ **円形・楕円・有機的シェイプ**(blob、アーチ、不規則角丸)
- ✅ **大胆な余白**(空気感)
- ✅ **筆記体(Italianno)アクセント**(`amour` `pardonnez` `merci` 等のフランス語)
- ✅ **大きな数字 / ローマ数字**(Scene I, II...、Layer 01, 02)
- ✅ **波形 SVG divider**(セクション間を曲線で繋ぐ)
- ✅ **半透明背景 rect**(SVG ラベルの可読性、被り対策)
- ✅ **ボーダー強調なし、線は細く**

### 配色(CSS 変数で定義済、`:root` で管理)
- アイボリー: `--ivory: #FBF6EA`、`--paper: #F6EFE0`
- 主要文字: `--deep: #1A2336`、`--shadow: #4A5B7C`
- 淡シアン: `--mist-1`, `--mist-2`, `--vili-blue`, `--vili-shadow`
- ゴールド: `--gold: #B8975C`、`--gold-light`
- ボルドー(CTA): `--rouge: #8B2942`
- 暖色 Act I: `--warm-1`, `--warm-2`

### フォント
- 見出し英: `Cinzel`(大文字)、`Playfair Display`、`Cormorant Garamond`
- 見出し和: `Noto Serif JP`
- 本文和: `Noto Sans JP`
- 筆記体: `Italianno`

---

## 配役(LP 内表記、正式)

| 役 | 名前 | 英表記 |
|----|------|--------|
| ジゼル | 森田 愛海 | Ami Morita |
| アルブレヒト | 福岡 雄大 | Yudai Fukuoka |
| ミルタ | 渡辺 与布 | Atau Watanabe |
| ヒラリオン | 上中 佑樹 | Yuki Kaminaka |
| バチルダ | 奥野 凜 | Rin Okuno |
| ペザント | 鈴木 賢陽 / 本田 千晃 | Kenyo Suzuki / Chiaki Honda |
| ドゥ・ウィリ | 中野 伶美 / 本田 千晃 | Remi Nakano / Chiaki Honda |
| ジゼルフレンズ | 内藤 亜仁 / 中野 伶美 / 東野 瑞生 / 山本 怜 | Ami Naito / Remi Nakano / Mizuki Higashino / Rei Yamamoto |

⚠️ 英表記ミス頻発ポイント:
- 森田 = Ami(Manami じゃない)
- 中野 = Remi(Reimi じゃない)
- 渡辺 = Atau(Yo じゃない)
- 内藤 = Ami(Ahito じゃない、ファイル名 ahito だが正式は Ami)

---

## 未完了 / TODO リスト

### 待ち状態(ユーザー側 LINE 連絡で動く)

| 待ち相手 | 内容 | 私の準備 |
|---------|------|---------|
| 出演者 11 名 | 所属確認 LINE 返答 | 送信済(セッション 3) |
| 鈴木賢陽 | 別途チャットで所属 | LP に「準備中」placeholder 配置済 |
| 本田千晃 | **主宰の言葉(動画 or 直筆メッセージ)** | LP に「枠」配置済、 中身待ち |
| 古川さん | **ペア割 + 全席種共通特典(BSC 体験券)** | 未連絡 |
| コール・ド全員 | **「ここで踊る理由」 ヒアリング** | 未連絡 |
| 動画 A#0 | 5/29 公開予定 | Video セクション プレースホルダー、公開後 iframe 埋め込み |

### Phase 2 で追加したいもの(優先順)

1. **動画 A#0 の YouTube iframe 埋め込み**(現在プレースホルダー)
   - 動画公開予定: 2026/5/29
   - URL 確定後、Video セクションの aspect-video div の中に iframe を挿入

2. **Google Maps iframe 埋め込み**(現在プレースホルダー)
   - 場所: Access セクション
   - めぐろパーシモンホール: 東京都目黒区八雲 1-1-1
   - Google Maps 共有 iframe コードを差し込む

3. **プレイガイド実 URL 反映**(現在 `#` プレースホルダー)
   - イープラス / ローソンチケット / アソビュー! / 東京音協
   - チケットぴあだけは既に実 URL(http://t-onkyo-web.pia.jp/event.do?eventCd=2606835)

4. **スポンサーロゴ画像**(現在テキストのみ)
   - 株式会社 MAKERS / Naturecan 株式会社
   - ロゴ画像をユーザーから受領 → `images/sponsors/` に配置
   - Sponsors セクションの `<p>` を `<img>` に置換

5. **FAQ セクション追加候補**
   - 「初心者でも楽しめますか?」
   - 「子供連れでも大丈夫ですか?」
   - 「車椅子席はありますか?」
   - 「キャンセル・払い戻しは?」
   - 「写真撮影・録音は?」

6. **「ちあこからのメッセージ」セクション**(オプション)
   - 本田千晃から観客へのメッセージ(直筆風 or 筆記体)
   - Synopsis の前 or Final CTA の前

7. **OGP 画像 + ファビコン**(SNS シェア用)
   - `images/og-image.jpg`(1200×630px、Hero っぽいビジュアル)
   - `favicon.ico`

8. **過去公演アーカイブセクション**(オプション)
   - 2025 ドン・キホーテ、2024 〇〇 など過去公演の写真ギャラリー
   - "Past Performances" として Final CTA の前

9. **A 席訴求のさらなる強化**
   - Tickets セクションで「A 席の見え方」を画像 or 図解で示す
   - 残席リアルタイム表示(将来動的)

10. **JS でスムーズスクロール強化、アニメーション追加**
    - 現在は IntersectionObserver で reveal animation あり
    - 各要素ごとに微妙な delay 付与で「一気に見せる」感を演出

### 既知の課題

- **A 席プレイガイド全 URL を実際のリンクに**(ユーザー確認待ち)
- **デスクトップ相関図のレスポンシブ**:画面幅 800-900px くらいで矢印位置がズレる可能性、要確認
- **モバイルでの相関図**:現在は対関係カードの簡易版、デスクトップと同じ図にしたい場合は再設計が必要
- **Hero の文字が薄すぎないか**:現在は白 + 3 段シャドウで強化済、ユーザー確認済

### 公開 / デプロイ

- 現在 Vercel(or Netlify)で公開済の想定
- URL は本田さんに共有済(別 session で URL を確認すること)
- 修正後の再デプロイ:`vercel` 再実行 or Netlify Drop で再アップロード

---

## ユーザー(岩月響諒)の好みパターン

- **数字にコミット**(CTR、A 席残席など具体的)
- **物語性・世界観**を大事に
- **「AI 感」「テンプレ感」を強く嫌う**(=オリジナリティ重視)
- **本物のバレエファンに響く品位**を保ちつつ、初心者にも入りやすい
- **修正は具体的に指摘してくれる**(「ここを変えて」型)

---

## 関連ファイル

- LP 設計書: `../2026-05-20-公演LP設計.md`(初期設計)
- A 席戦略 v2: `../2026-05-20-A席を売る作戦_v2.md`(LP の戦略目的)
- 動画戦略 v3: `../2026-05-20-動画戦略マップ_v3.md`(LP と動画の連動)
- 公演コンセプト: `../コンセプト.md`(公演事業の根幹)
- 販売状況: `../2026夏ジゼル_販売状況_2026-05-11.md`(数字データ)
- ポスター画像: `~/Downloads/ポスター画像`(ユーザー提供、世界観の元)

---

## メイン session(/Users/nariaki/株式会社CONFY/) の状態

メイン session では今、以下が進行中:

- 株式会社CONFY 構造構築完了(役員制 6 名、知識ベース 76+ ファイル)
- 公演戦略全体設計済
- 島田退職対応進行中(5/31 退職)
- credential 移行(5/28 期限)
- ¥34,000 振込(5/28 期限)
- 動画 A#0 撮影スケジュール調整中(プロカメラマン)

LP 関連の戦略・コンテンツは既に上記ファイルに整理済。**この LP session はデザイン・実装に集中する**。経営判断はメイン session に持ち帰る。

---

## 新 session の最初の一歩

このメモを読んだら、`index.html` を Read で読み込んで現状を把握 → ユーザーの修正指示を待つ。

「LP の作り込み、何から手を付けますか?」と聞く形でスタートするのが良い。
