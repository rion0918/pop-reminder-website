# 待機リスト運用

## 何を測るか

公式サイトの「リリースを待つ」を押した参加数を、公開前の関心を示す需要指標として扱います。メールアドレス、氏名、IPアドレス、User-Agentは待機リストのデータベースへ保存しません。

1件は厳密な「1人」ではなく、ブラウザで生成した匿名IDのハッシュ1つです。同じブラウザからの再登録は増えませんが、サイトデータの消去、別ブラウザ、別端末からの参加は別の1件になります。反対に、同じブラウザを共有する人は1件になります。この数字は需要の方向を見るための目安であり、正確な人数や閲覧者に対する参加率ではありません。

## SNS用URL

投稿するURLには`utm_source`、`utm_medium`、`utm_campaign`を付けます。投稿単位で分けたい場合だけ`utm_content`を追加します。

```text
https://fuwatto.pages.dev/?utm_source=x&utm_medium=social&utm_campaign=launch
https://fuwatto.pages.dev/?utm_source=instagram&utm_medium=social&utm_campaign=launch
https://fuwatto.pages.dev/?utm_source=tiktok&utm_medium=social&utm_campaign=launch
```

UTM値には個人名やメールアドレスなどを入れないでください。短く一貫した英小文字を使うと集計しやすくなります。

## 件数を確認する

Cloudflareへログインした端末で実行します。

```bash
npm run waitlist:count
npm run waitlist:campaigns
```

`waitlist:count`は現在参加中の総数、`waitlist:campaigns`は流入元・媒体・キャンペーン別の現在参加中の件数です。ユーザーが「参加を取り消す」を押すと、その1件は集計から削除されます。

## 保存内容と削除

D1の`waitlist_signups`には次だけを保存します。

- 匿名IDのSHA-256ハッシュ
- `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`
- 参加日時

生の匿名IDはブラウザの`localStorage`だけに置き、APIではハッシュへ変換してから保存します。参加時と同じブラウザから取消を実行すると、対応するハッシュの行だけを削除します。需要調査を終了したときは、運営者がD1の待機リストデータを削除します。

## 実装上の境界

- `GET /api/waitlist`はHTTP 405とし、件数を一般公開しません。
- `_routes.json`でFunctionsの実行対象を`/api/*`だけに限定します。
- 外部の解析SDKや広告SDKは追加しません。
- 閲覧数を保存しないため、参加率を算出する場合は別途計測方針とプライバシー表示を検討します。

## 参照

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
