# フロントエンドのテスト

Node.js 24 / npm を使います。実行場所は `frontend/` です。

```bash
npm ci
npx playwright install chromium
npm test                 # 単体 + Chromium + Storybook
npm run test:unit        # DOM不要の単体テスト
npm run test:browser     # Chromium + Storybook
npm run test:coverage    # 全テスト + カバレッジの下限検査
npm run test:watch       # 変更を監視
npm run ci              # 命名・Biome・型検査・本番ビルド
npm run build-storybook
```

Linux CI では `npx playwright install --with-deps chromium` でOS依存もインストールします。
ブラウザテストはローカルサーバーを起動するため、ポート待受が禁止されたsandboxでは実行できません。

## 構成

- `*.test.ts`: VitestのNode環境。API境界、認証の競合、payload、store、純粋関数。
- `*.browser.test.tsx`: 実際のChromium。Reactの画面、キーボード、フォーカス、非同期操作、ページ遷移。
- `*.stories.tsx`: Storybook。表示variantと`play`による操作検証。
- `src/test/`: 共通fixture、描画・後片付け、認証/SWR状態の初期化。
- `src/test/assets/triangle.gltf`: 外部配信に依存しない最小の3Dモデル。

テストは対象機能の近くに置きます。テストファイルのsuffixを除いた名前は既存のcamelCase規則に従います。

## 検証範囲

| 領域 | 主な検証 |
| --- | --- |
| 認証・HTTP | Cookie付きrefresh/callback、同時要求の共有、401の一度だけの再送、ログアウト、古いセッションの応答破棄、HTTP/ネットワークエラー、multipart、204 |
| API境界 | URL・method・認証ヘッダー・snake_case、作品/プロフィール/コメント/タグ/アセット/お気に入り |
| 一覧・詳細・プロフィール | 一覧から詳細への遷移、タグ検索、表示件数、ページ境界、30件固定のユーザー作品、空/loading/403/404/500、同じURLでの再試行 |
| 編集・保存 | 新規/編集の初期化、所有者、差分PATCH、入力保持、保存中の操作禁止、公開確認、Markdownモード、未保存時の離脱防止 |
| アップロード・タグ | 形式/容量/重複、失敗と再試行、孤立リソース、reset前の非同期完了の破棄 |
| コメント・お気に入り | 未認証、返信先、入力trim、二重送信防止、成功後の再取得、失敗時の入力保持/楽観的更新の巻き戻し、一覧の不要な個別取得防止 |
| 共通UI | Listbox/Popoverの矢印・Home/End・Enter・Escape・外側クリック・フォーカス復帰、ページ省略部分、URL正規化/重複/上限、タグのIDによる削除 |
| メディア | URL安全性、画像の実読込と失敗時fallback、疑似全画面の解除、動画MIME、シーク/音量/自動非表示、実WAV decode、実GLTF読込と操作・後片付け |
| その他 | プロフィール検証、アカウント操作、共有/コピーのfallback、MarkdownのHTML/危険URL、エラー境界 |

表示できただけのStoryと、操作・結果をassertしたテストは同じ保証ではありません。画像Storyは自然サイズを確認し、代替表示が出ただけでは成功にしません。

## テストを書くとき

- アプリ内部のhookやstoreを丸ごとmockせず、原則`fetch`など外部境界で応答を制御します。GLTF/WAVはローカルfixtureで読み込みます。
- 成功だけでなく失敗、空、未認証、処理中、キャンセル、古い応答を検証します。競合はdeferred promiseで順序を制御します。
- `getByRole`/ラベルを優先し、DOMの結果や通知、送信内容をassertします。固定時間のsleepで完了を推測しません。
- `expect.element`/`expect.poll`で非同期完了を待ち、保留中promiseはテスト中に解決します。
- 前のテストのReact root、認証、SWR、spyを次に持ち越しません。グローバル`mutate`を使用する本体コードのため、SWRも実際のグローバルcacheを使って検証します。
- PlaywrightのFile転送は`lastModified`を再生成します。同一ファイルの重複判定はDataTransferで同じFileを渡して検証します。

## CIとカバレッジ

GitHub Actionsで静的チェック後にChromiumをインストールし、`test:coverage`を実行します。
カバレッジHTMLは `coverage/index.html`、集計は `coverage/coverage-summary.json` です。CIでは`coverage` artifactとして保存します。

集計には未importの実装も含め、Story・テスト・fixture・型宣言・起動エントリだけを対象外にします。型のみのモジュールは実行行数0です。
カバレッジ下限は `vite.config.ts` に記載しています。数値を上げるために失敗ケースや未検証の実装を除外しないでください。

## 限界と別途確認する事項

- APIはstubです。実バックエンドの認証Cookie、Discord、DB、S3との統合成功を保証しません。fixtureのIDはUI向けの識別子です。
- Swagger/schemaとの照合では、現行backendの作品更新 `asset_ids` / `tag_ids` に `min=1` がある一方、frontendは全削除を空配列として送ります。payloadテストは送信内容の保証であり、実APIがその削除を受け付ける保証ではありません。backendの変更はこの作業に含めていません。
- 公開範囲フィルターと並び順のUIは現行コードでは一覧取得条件に接続されていません。機能が完成したようなテストは追加していません。
- Chromium以外、iOS固有のfullscreen/共有、実機タッチ操作、全動画codec/FBXアニメーション、画面全体の見た目は別途確認が必要です。
- React/SWRのSuspenseと一部既存StoryでReactの警告が出る場合があります。テスト失敗・未処理例外と区別し、警告を一括抑制していません。
