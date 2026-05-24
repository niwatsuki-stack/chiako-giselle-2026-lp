# 公演 LP プロトタイプ(2026 ジゼル)

> 2026/7/30 ジゼル公演用の LP。HTML + Tailwind CSS(CDN)で爆速プロトタイプ作成。
> 設計詳細: [../2026-05-20-公演LP設計.md](../2026-05-20-公演LP設計.md)

## ファイル

- `index.html` — LP 本体(1 ファイル完結、Tailwind CDN 使用)

## ローカルで確認

```sh
open /Users/nariaki/株式会社CONFY/事業/バレエ公演/lp/index.html
```

ブラウザで開けば見れます。

## 構成セクション

1. ヘッダー(ナビ + チケット購入 CTA)
2. ヒーロー(公演名、日時、会場、CTA)
3. About(プロ + コール・ド構造、ジゼル作品解説)
4. Cast(配役:ジゼル=森田愛海、アルブレヒト=福岡雄大 / プロ 11 名 / コール・ド)
5. Video Series(動画 A#0 埋め込み予定)
6. Tickets(S/A/B 席、A 席はおすすめ強調、チケットぴあ + 4 プレイガイドへ)
7. First Time?(初心者向けガイド)
8. Venue(めぐろパーシモンホール、Google Maps 埋め込み予定)
9. Sponsors(MAKERS、Naturecan)
10. Final CTA + Footer

## デザイン

- 配色: アイボリー(#FBF7EF)ベース、テラコッタ(#E36B50)アクセント、深紺(#25313B)文字
- フォント: 見出し Noto Serif JP / 本文 Noto Sans JP
- レスポンシブ: モバイル優先(Tailwind)

## まだ未対応(Phase 2 で対応)

- [ ] 動画 A#0 の YouTube 埋め込み(公開後にコード追加)
- [ ] Google Maps 埋め込み(iframe 追加)
- [ ] イープラス・ローソン・アソビュー・東京音協の実 URL 反映
- [ ] スポンサーロゴ画像差し込み
- [ ] OGP 画像追加
- [ ] ファビコン

## 公開手順(Vercel デプロイ例)

別 session で:

```sh
cd /Users/nariaki/株式会社CONFY/事業/バレエ公演/lp
# Vercel CLI インストール済み前提
npx vercel
# プロンプトに従って公開
```

または GitHub Pages、Netlify Drop でも可。

## カスタムドメイン候補

- `giselle.confy.co.jp`(サブドメイン推奨)
- `ballet.confy.co.jp/giselle2026/`(既存 HP 配下)

DNS 設定は Vercel/Netlify デプロイ後に行う。

## 修正・編集

- HTML 直接編集
- 変更内容を [LP設計.md](../2026-05-20-公演LP設計.md) と同期させる
- 動画 A#0 公開後に Video Series セクションに iframe 埋め込み
- 残席状況を将来動的に表示(Phase 2)

## 関連

- [公演 LP 設計](../2026-05-20-公演LP設計.md) — 設計詳細
- [動画戦略マップ v3](../2026-05-20-動画戦略マップ_v3.md)
- [A 席を売る作戦 v2](../2026-05-20-A席を売る作戦_v2.md)
