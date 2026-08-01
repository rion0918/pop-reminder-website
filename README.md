# ふわっと。公式サイト

リマインダーアプリ「ふわっと。」の公式プロモーションサイトです。

- 公開サイト: <https://pop-reminder.pages.dev/>
- アプリ本体: <https://github.com/rion0918/pop-reminder>
- ホスティング: Cloudflare Pages

「忘れる前に、数秒だけ。」というアプリの世界観を、実際の画面、泡のビジュアル、物理感のあるモーションで伝えます。HTML、CSS、JavaScriptだけで構成し、外部CDNや実行時フレームワークには依存しません。

## 必要な環境

- Node.js 24
- npm
- ローカルプレビューにはPython 3
- 手動デプロイにはCloudflare Wranglerのログイン

## ローカルで確認する

```bash
npm run dev
```

`dist/`を生成して、<http://localhost:4173> で配信します。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run check` | JavaScript、SEO、構造化データ、必須ファイルを検証 |
| `npm run build` | Cloudflare Pagesへ配信する`dist/`を生成 |
| `npm run verify` | checkとbuildを順番に実行 |
| `npm run dev` | ビルド後のサイトをローカル配信 |
| `npm run deploy:cloudflare` | 検証後、Cloudflare Pagesへ手動デプロイ |

## ディレクトリ

```text
.
├── index.html             # トップページ、OGP、構造化データ
├── privacy.html           # プライバシーポリシー
├── terms.html             # 利用規約
├── styles.css             # サイト全体とレスポンシブ表現
├── legal.css              # 法務ページ共通スタイル
├── main.js                # 表示・ポインター・FAQモーション
├── public/assets/         # 配信用画像
├── scripts/               # 検証・ビルドスクリプト
├── docs/                  # 公開・SEO運用ドキュメント
└── dist/                  # 生成物。Git管理しない
```

## 更新時の基本手順

1. アプリ本体の実装・ストア文言と説明内容が一致しているか確認する。
2. コピー、画像、法務文書を更新する。
3. `npm run verify`を通す。
4. Pull Requestで表示と差分を確認する。
5. `main`へ反映して本番デプロイを確認する。

## 公開とSEO

本番URLは <https://pop-reminder.pages.dev/> です。canonical、OGP、構造化データ、`robots.txt`、`sitemap.xml`はこのURLを正本にしています。

独自ドメインへ変更する場合は、URLを一括で差し替えてから公開してください。詳しい手順は次を参照してください。

- [デプロイ運用](docs/DEPLOYMENT.md)
- [SEO運用](docs/SEO.md)
