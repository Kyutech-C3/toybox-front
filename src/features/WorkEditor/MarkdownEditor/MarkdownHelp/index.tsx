import styles from "./index.module.css";

const EXAMPLES = [
  {
    name: "見出し",
    syntax: "## 使い方",
    description: "左側のアイコンから見出しへのリンクをコピーできます。",
  },
  {
    name: "文字の装飾",
    syntax: "**太字** / *斜体* / ~~取り消し線~~ / `コード`",
    description: "段落内で改行するには行末に半角スペースを2個入れます。",
  },
  {
    name: "リスト・引用",
    syntax: "- 項目\n1. 手順\n> 引用",
    description: "字下げで入れ子にできます。",
  },
  {
    name: "チェックリスト",
    syntax: "- [x] 完了\n- [ ] 未完了",
    description: "チェックは表示専用です。",
  },
  {
    name: "リンク・画像",
    syntax:
      "[サイト](https://example.com)\n![画像の説明](https://example.com/image.png)",
    description:
      "URL だけを書いてもリンクになりません。参照形式にも対応しています。",
  },
  {
    name: "コードブロック",
    syntax: '```ts:src/main.ts\nconst message = "Toybox";\n```',
    description:
      "言語とファイル名は省略できます。ブロック内のコードをコピーできます。",
  },
  {
    name: "表",
    syntax: "| 項目 | 状態 |\n| --- | --- |\n| 開発 | 完了 |",
    description: "列の左右・中央揃えにも対応しています。",
  },
  {
    name: "脚注",
    syntax: "説明[^1]\n\n[^1]: 補足の内容",
    description: "番号から脚注へ、脚注から本文へ移動できます。",
  },
  {
    name: "補足・注意書き",
    syntax: "> [!NOTE]\n> 補足の内容",
    description:
      "NOTE / TIP / IMPORTANT / WARNING / CAUTION に対応しています。",
  },
  {
    name: "折りたたみ",
    syntax:
      "<details><summary>詳しい使い方</summary>\n\nここに Markdown を書きます。\n\n</details>",
    description:
      "本文の前後には空行を入れてください。<details open> で最初から開けます。",
  },
];

const MarkdownHelp = () => (
  <details className={styles["markdown-help"]}>
    <summary>Markdown の書き方</summary>
    <div className={styles["help-table-container"]}>
      <table>
        <thead>
          <tr>
            <th scope="col">記法</th>
            <th scope="col">書き方</th>
          </tr>
        </thead>
        <tbody>
          {EXAMPLES.map(({ name, syntax, description }) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td>
                <pre>
                  <code>{syntax}</code>
                </pre>
                <p>{description}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      数式、Mermaid、外部サービスの埋め込み、絵文字ショートコードには対応していません。HTML
      は許可されたタグ・属性だけが表示されます。
    </p>
  </details>
);

export default MarkdownHelp;
