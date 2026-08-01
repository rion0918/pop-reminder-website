# SEO運用

## URLの正本

現在の正規ドメインは `https://pop-reminder.pages.dev` です。

| ページ | canonical |
| --- | --- |
| トップ | `https://pop-reminder.pages.dev/` |
| プライバシーポリシー | `https://pop-reminder.pages.dev/privacy` |
| 利用規約 | `https://pop-reminder.pages.dev/terms` |

## SEO関連ファイル

- `index.html`: title、description、canonical、OGP、Twitter Card、JSON-LD
- `privacy.html`: 法務ページのtitle、description、canonical
- `terms.html`: 法務ページのtitle、description、canonical
- `robots.txt`: クロール許可とsitemap URL
- `sitemap.xml`: インデックス対象URL
- `site.webmanifest`: アプリ名、テーマ色、アイコン
- `public/assets/og-image-dream.png`: 1731×909の共有画像（ドリームテーマ）

## 公開前チェック

```bash
npm run check
```

このチェックでは次を検証します。

- 必須ファイルと画像が存在する。
- トップページのtitle、description、canonical、OGPが存在する。
- h1が各ページに1つだけ存在する。
- JSON-LDが有効なJSONとして解析できる。
- 法務ページにtitle、description、canonicalが存在する。
- reduced motion対応が存在する。

## コピーや機能を変更する場合

説明内容の正本はアプリ本体リポジトリのREADME、ストア掲載文案、実装です。特に次の表現は実装と一致させます。

- 対応OSと公開状況
- 通知タイミング
- ウィジェットの対応状況
- ログイン・クラウド同期の有無
- 広告SDK・解析SDKの有無
- 端末内に保存するデータ

未公開機能を現在利用できるように断定しません。数値やレビューなど、根拠のない実績も追加しません。

## ドメイン変更チェックリスト

次のファイルにある旧ドメインを新しい正規ドメインへ一括で変更します。

```bash
rg -n "pop-reminder\.pages\.dev" index.html privacy.html terms.html robots.txt sitemap.xml README.md docs
```

変更対象:

1. canonical
2. `og:url`、`og:image`、Twitter Card
3. JSON-LDの`@id`、`url`、`image`、`screenshot`
4. `robots.txt`のsitemap URL
5. `sitemap.xml`の全URL
6. READMEと運用ドキュメント

変更後は`npm run verify`を実行し、旧ドメインから新ドメインへの301または308リダイレクトを確認します。

## 公開後

- Google Search Consoleへプロパティを追加する。
- `https://<domain>/sitemap.xml`を送信する。
- URL検査でトップページを確認する。
- SNSの共有デバッガーでOGP画像と説明文を確認する。
- 法務ページがインデックス可能で、canonical先が200を返すことを確認する。
