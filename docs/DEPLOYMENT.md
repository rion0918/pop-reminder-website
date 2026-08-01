# デプロイ運用

## 現在の構成

| 項目 | 値 |
| --- | --- |
| Cloudflare Pagesプロジェクト | `fuwatto` |
| 本番URL | <https://fuwatto.pages.dev/> |
| 本番ブランチ | `main` |
| ビルドコマンド | `npm run build` |
| 出力ディレクトリ | `dist` |
| Pages方式 | Direct Upload |
| Functions | `/api/*`のみ |
| D1 | `pop-reminder-waitlist` |

このPagesプロジェクトはWranglerから作成したDirect Upload方式です。Cloudflareの仕様上、同じプロジェクトを後からネイティブGit連携へ変更することはできません。そのため、本番URLを維持した自動デプロイにはGitHub ActionsからWranglerを実行します。

## `pop-reminder`からの移行

Cloudflare Pagesの既存プロジェクト名は直接変更できないため、2026年8月1日に`fuwatto`プロジェクトを新規作成して本番を移行しました。D1の`pop-reminder-waitlist`は同じデータベースを継続利用します。

旧`pop-reminder`プロジェクトは削除せず、`legacy/pop-reminder/_redirects`だけを配信して新URLへHTTP 301で転送します。通常のサイトは旧プロジェクトへデプロイしないでください。

## 通常のリリースフロー

1. 作業ブランチで変更する。
2. `npm run verify`を実行する。
3. Pull Requestを作成し、CI結果と表示を確認する。
4. `main`へマージする。
5. GitHub ActionsがD1マイグレーションを適用し、`dist/`とPages Functionsを`fuwatto`へデプロイする。
6. 本番URLと法務ページ、OGP画像を確認する。

## GitHub Actionsに必要なSecrets

リポジトリの `Settings > Secrets and variables > Actions` に次を登録します。

| Secret | 内容 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare PagesとD1へのEdit権限を持つAPIトークン |

APIトークンはCloudflareダッシュボードの `My Profile > API Tokens` からCustom Tokenとして作成します。権限は対象アカウントの `Cloudflare Pages: Edit` と `D1: Edit` に限定します。トークン値をファイル、Issue、ログ、コミットへ保存しないでください。

## 手動デプロイ

GitHub Actionsが利用できない場合のみ、Cloudflareへログイン済みの端末から実行します。

```bash
npm run db:migrate:remote
npm run deploy:cloudflare
```

デプロイ後に表示される固有URLで確認し、続いて本番URLを確認します。

## リリース確認

```bash
curl -fsSIL https://fuwatto.pages.dev/
curl -fsSIL https://fuwatto.pages.dev/privacy
curl -fsSIL https://fuwatto.pages.dev/terms
curl -fsSIL https://fuwatto.pages.dev/assets/og-image-fuwatto.png
curl -fsSIL https://fuwatto.pages.dev/sitemap.xml
curl -fsSI https://fuwatto.pages.dev/api/waitlist
```

確認項目:

- トップ、プライバシーポリシー、利用規約がHTTP 200になる。
- OGP画像のContent-Typeが`image/png`になる。
- sitemapのContent-Typeが`application/xml`になる。
- 待機リストAPIへのGETがHTTP 405になり、登録数を公開しない。
- 本番HTMLのcanonicalが本番URLを指す。
- デスクトップとモバイルで主要コピーとCTAが欠けない。
- ブラウザコンソールにエラーがない。

## ロールバック

1. Cloudflare Dashboardで `Workers & Pages > fuwatto > Deployments` を開く。
2. 最後に正常だった本番デプロイを選ぶ。
3. `Rollback to this deployment` を実行する。
4. 本番URLを再確認する。
5. 原因となった変更はGitでrevertし、修正版を通常フローで再公開する。

ロールバックは配信状態だけを戻します。Gitの`main`は自動で戻らないため、必ずリポジトリ側も整合させます。

## 独自ドメインへ移行する場合

1. Cloudflare PagesのCustom domainsへドメインを追加する。
2. TLSとリダイレクトを確認する。
3. [SEO運用](SEO.md)のURL変更チェックリストを実行する。
4. 旧`pages.dev` URLから新ドメインへの恒久リダイレクトを設定する。
5. Search Consoleへ新しいsitemapを送信する。

## 参照

- [Cloudflare Pages: Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages: Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Pages: Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Pages FunctionsのD1バインディング](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare Pages: Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
