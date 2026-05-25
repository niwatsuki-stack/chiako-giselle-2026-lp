# 広告 Pixel / Tag 取得手順書(2026 GISELLE LP)

> 4 つの広告基盤(Meta / LINE / TikTok / YouTube リマーケ)の ID を取得して、 LP に仕込めば **「LP 訪問者 → 広告で再アプローチ」 のリターゲ基盤** が完成する。 ID を教えてもらえば、 LP への仕込みは Claude 側で 15 分で完了。

---

## 全体像

| Pixel/Tag | 用途 | 必要なもの | 工数 |
|-----------|------|-----------|------|
| **Meta Pixel** | FB / Instagram 広告のリターゲ | FB ビジネスアカウント + Pixel ID(15-16桁数字) | 20 分 |
| **LINE Tag** | LINE 広告のリターゲ | LINE Ads アカウント + Tag ID | 30 分 |
| **TikTok Pixel** | TikTok 広告のリターゲ | TikTok For Business アカウント + Pixel ID | 20 分 |
| **YouTube リマーケ** | YouTube プレロール広告 | Google Ads アカウント + Conversion ID | 25 分(GA4 連携あり) |

---

## 1. Meta Pixel(Facebook / Instagram)

### 取得手順
1. **Facebook Business Manager** にログイン:<https://business.facebook.com/>
   - 個人 FB アカウントから自動でログイン可
2. 「ビジネス設定」 → 「ビジネスアカウント作成」(未作成の場合)
   - アカウント名: 「株式会社CONFY」
   - 名前 + メール 入力
3. 左メニュー「データソース」 → 「ピクセル」 → 「**+ 追加**」
4. ピクセル名: 「**2026 GISELLE LP Pixel**」
5. ドメイン: 「**balletshorts.confy.co.jp**」 入力 → 「続行」
6. インストール方法: 「**手動でコードをインストール**」 を選択
7. 表示される Pixel ID(**15-16 桁の数字、 例: `1234567890123456`**)をコピー
8. → **Claude にこの数字を伝える**(LP に仕込みます)

### コードの中身(参考、 Claude が自動挿入)
```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){...}(...);
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

---

## 2. LINE Tag(LINE Ads)

### 取得手順
1. **LINE for Business** ログイン:<https://www.linebiz.com/jp/login/>
   - 既存の LINE 公式アカウント(教室 / ちあこちゃんねる)から繋がる
2. 「LINE Ads(LAP)」 を選択 → 広告アカウント新規作成(無料、 利用前審査あり 1-3 日)
   - アカウント名: 「ちあこと愉快な仲間達」
   - 業種: 「興行・イベント」
3. 左メニュー「共有ライブラリ」 → 「LINE Tag」 → 「**新規作成**」
4. 「ベースコード」 + 「コンバージョンコード(購入)」 をそれぞれ取得
5. → **Claude に Tag ID(7-8 桁数字、 例: `12345678`)を伝える**

### 注意
- 審査に **1-3 営業日** かかる
- 既存 LINE 公式アカウントの「友だち追加 → 公演リマインダー」 とは別の仕組み
- 広告予算 最低 ¥1,000/日 〜 で運用可能

---

## 3. TikTok Pixel(TikTok For Business)

### 取得手順
1. **TikTok For Business** ログイン:<https://ads.tiktok.com/i18n/login/>
   - 個人 TikTok アカウント or 新規メールで登録
2. 「ビジネスセンター」 → 「新規広告アカウント」 → 「日本」 選択
3. 左メニュー「アセット」 → 「イベント」 → 「**ウェブイベント**」 → 「**Pixel 接続**」
4. インストール方法: 「**Pixel コード手動インストール**」
5. Pixel 名: 「2026 GISELLE LP」
6. → **Claude に Pixel ID(英数字 20 桁前後、 例: `C8XXXXXXX0FG4XXXXXXX`)を伝える**

### 注意
- バレエ層のユーザーは若年女性多い → TikTok は意外と効く可能性高い
- ちあこちゃんねるの TikTok 公式アカウント連携で運用可

---

## 4. YouTube リマーケティング(Google Ads + GA4 連携)

### 前提
- GA4 は既に設置済み(`G-GM1E9FGCST`)
- Google Ads アカウントが必要(無料、 広告出稿しなくても OK)

### 取得手順
1. **Google Ads** ログイン:<https://ads.google.com/>
   - 個人 Google アカウントから登録(響諒さん本人のアカウント可)
2. 「ツールと設定」 → 「オーディエンスマネージャー」 → 「**+ オーディエンスソース**」
3. 「Google Analytics 4(GA4)」 を選択 → 既存の GA4 プロパティ(G-GM1E9FGCST)を選択 → 「リンク」
4. **GA4 オーディエンスが自動で Google Ads に連携される**
5. → 「LP 訪問者」「PURCHASE クリック者」「LINE 友達追加者」 等のセグメントが広告ターゲットに使える
6. → **追加コードは不要、 GA4 のままで OK**

### YouTube プレロール広告を打つには
- Google Ads で 「動画キャンペーン」 作成
- ターゲティング: 上記オーディエンス + 「バレエ 関連視聴者」 等
- 予算 ¥500/日 〜 で運用可

---

## 5. 全部揃ったら(Claude への ID 共有)

以下の形式で Claude に伝えてください:

```
Meta Pixel: 1234567890123456
LINE Tag: 12345678
TikTok Pixel: C8XXXXXXX0FG4XXXXXXX
YouTube リマーケ: (GA4 連携で完了、 ID 不要)
```

→ Claude が以下を 15 分で実装:
1. LP の `<head>` に各 Pixel/Tag コード追加
2. CSP(`_headers`) に各広告プラットフォームの drm 追加
3. PURCHASE クリック / LINE 友達追加 / シェア 各イベントを Pixel/Tag にも発火
4. デプロイ + 動作確認

---

## 6. 運用後のアクション

### Pixel/Tag 仕込み済み = リターゲ広告の準備完了。 次に:

#### 短期(1-2 週間で実施)
- **Meta 広告** で 「LP 訪問したが PURCHASE クリックしてない人」 にリターゲ
  - 予算 ¥500-1000/日、 IG ストーリーズ広告で動画素材
- **LINE 広告** で 「LINE 友達追加してない LP 訪問者」 に追加促進
- **TikTok 広告** で 「ちあこちゃんねる視聴者 + 似たユーザー」 にリーチ拡大

#### 中期(公演前 1 ヶ月)
- **YouTube プレロール** で バレエ系チャンネル視聴者にリーチ
- **Google 検索広告** で 「バレエ 公演 東京 2026」 等で出稿

#### 効果計測
- GA4 で 流入元別 CV 率を週次レビュー
- Microsoft Clarity でセッションリプレイから離脱箇所改善
- 予算配分は ROAS(広告費用対売上)で最適化

---

## 7. 予算の目安(公演まで 2 ヶ月の想定)

| 広告 | 月予算 | 期待効果 |
|------|--------|---------|
| Meta(FB/IG)リターゲ | ¥15,000 | 100-200 名にリーチ、 CV 5-10 |
| LINE 広告 | ¥10,000 | 友達追加 30-50、 CV 3-5 |
| TikTok 広告 | ¥10,000 | 1,000+ リーチ、 CV 5-10 |
| YouTube プレロール | ¥10,000 | 5,000+ 視聴、 CV 3-5 |
| **合計** | **¥45,000 / 月** | **CV 16-30 名 / 月** |

平均チケット ¥8,000 とすると CV 20 名 = ¥160,000 の売上 → **ROAS 約 3.5 倍** が期待値。

---

## 8. リスク / 注意事項

- **Meta / TikTok の審査**: 業種(興行)の場合 1-3 日で通過、 BTS NG な薄着画像等は審査落ち
- **LINE Tag の審査**: 1-3 営業日
- **広告予算は事前に決める**: 「最大 ¥X」 で運用、 自動停止設定
- **A/B テスト**: クリエイティブ(画像 / 動画)を 2-3 種類用意して効果比較

---

## 9. 次のアクション

1. 上記 4 つの ID 取得(最も簡単な順): Meta → TikTok → YouTube(GA4 連携) → LINE
2. ID を Claude に共有
3. Claude が 15 分で LP に仕込み
4. 翌日以降、 広告キャンペーン作成 + 運用開始

不明点あれば Claude に聞いてください。
