# プロンプト最適化

[![npm](https://img.shields.io/npm/v/@minus77/dsh-prompt-optimize?color=3a42d6)](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) [![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

[中文](./README.md) · [English](./README_en.md) · [Español](./README_es.md) · [Français](./README_fr.md) · [Deutsch](./README_de.md) · [Русский](./README_ru.md) · **日本語** · [Português (BR)](./README_pt.md)

入力欄にある荒削りな下書きを、そのまま使えるプロンプトに変えるDeepSeek Harnessプラグインです。置き換える前に1行ずつのdiffを確認でき、置き換えた後も9秒間は元に戻せます。さらに、バージョン比較ができるローカル履歴、6観点のチェック、2案の切り替え、15個の組み込みテンプレートと自作テンプレートを備えています。

テンプレートの選び方と各テンプレートの用途は [テンプレートガイド](./docs/TEMPLATES.ja.md) を参照してください。

![最適化パネル](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/02-panel.png)

## なぜ必要か

「うまく動かない」プロンプトの多くは、モデルの問題ではなく下書きの問題です。依頼は書かれていても、材料・成果物・境界が書かれていません。このプラグインは**入力欄から離れずに**その隙間を埋め、自分の書いた言葉に触れてよいかどうかは、diffと取り消しの猶予に委ねます。

- **切り替え不要**: 入力欄の上にボタン1つでパネルが開きます。
- **確認できる**: 書き戻す前に、何が変わるかを1行ずつのdiffで示します。
- **取り消せる**: 置き換えた後9秒間は元に戻せます。
- **繰り返せる**: 結果に対して変更を伝えると、その部分だけが動きます。
- **ローカル**: 履歴はこのマシンに残り、オンにしたときだけ保存されます。

## 機能

| 機能 | 内容 |
| --- | --- |
| 自動書き換え | パネルを開くと自動で1回実行されます。下書きを変えたら再実行できます |
| ストリーミング | テキストは逐次届き、いつでも停止できます。入力欄を塞ぎません |
| 行diff | 置き換える前に `-` / `+` の行を表示し、変更のない連続部分は折りたたみます |
| 9秒の取り消し | 置き換え後に取り消しバーが出て、時間が来ると自動で消えます |
| 履歴 | 直近50件をバージョン系列にまとめ、再現 / 比較 / 削除ができます |
| 比較 | 2列の対比に加えて、行単位の構造変化をローカルで要約します |
| プレースホルダー | 再利用できる断片を最大5個取り出し、`{{snake_case}}` の変数にします |
| テンプレート | basic / structure / examples / reasoning / iterate の5グループに分かれた7個の組み込みテンプレート |
| モデル固定 | セッションのモデルに従うか、このパネルだけモデルを固定できます |
| 8言語のUI | アプリのロケールに自動で追従します（中文・English・日本語・Español・Français・Deutsch・Русский・Português） |
| プライバシー | 履歴は既定でオフ。オンにしても `localStorage` の中に留まります |

## インストール

DeepSeek Harness `>= 0.2.2-rc.5` と Node.js `>= 24.9` が必要です。

### 1. npmからインストールする（推奨）

```bash
dsh plugin --profile web add @minus77/dsh-prompt-optimize
```

公開済みのパッケージ（[npm](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) / [release](https://github.com/Minus77/dsh-prompt-optimize/releases)）を取得します。そのまま手順2に進んでください。

<details>
<summary>オフラインインストール: ソースまたはリリースのtarballから</summary>

```bash
git clone https://github.com/Minus77/dsh-prompt-optimize.git
cd dsh-prompt-optimize
npm pack          # produces minus77-dsh-prompt-optimize-0.4.0.tgz
dsh plugin --profile web add file:$PWD/minus77-dsh-prompt-optimize-0.4.0.tgz
```

</details>

### 2. そのprofileで読み込む

`~/.dsh/profiles/<profile>/package.json` を編集し、`dsh.profile.bundles` にパッケージを追加します。

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@minus77/dsh-prompt-optimize"
      ]
    }
  }
}
```

そのprofileを再起動すると（`dsh --profile <profile>`）、入力欄の右側に "Prompt optimizer" のボタンが現れます。

> このリポジトリに対して `plugin_manager` の `install_bundle` でインストールすると、手順1と2がまとめて実行され、JSONを手で編集する必要はありません。

### ローカル開発

```bash
npm test                                   # 32 unit tests, no network
dsh plugin --profile dev add file:$PWD     # symlinked; restart to pick up edits
```

## 使い方

### 開く

下書きを書いてから、入力欄の右側にあるボタンをクリックします。

![入口](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/01-entry.png)

パネルが入力欄の上に開き、そのまま書き換えが始まります。初回は履歴を残すかどうかを尋ねられ、答えた内容は記憶されます。

### 確認と置き換え

ストリームが終わったら "Replace draft" をクリックすると、先にdiffが表示されます。

![diff確認](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/04-diff.png)

確定すると下書きが置き換わり、9秒間の取り消しバーが表示されます。

![取り消し](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/05-undo.png)

### チェック

結果カード右上の「チェック」は下書きを書き換えません。総合点、6観点の点数、重要度順に最大5件の問題を返します。各問題は原文の該当箇所を引用し、その場で適用できる置き換え案を提示します。ほかの文章は動きません。

![チェック](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/10-checkup.png)

### もう1案

結果がしっくりこないときは下部の「もう1案」を押します。直前の版は「もう1案」チップに退避され、2つを交互に見比べられます。文字数・所要時間・トークン数も表示中の版に合わせて切り替わります。

![もう1案](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/12-variants.png)

### 自作テンプレート

テンプレートメニューの最後が「新しい自作テンプレート」です。名前・書き換え指示・対象を入れて保存すると、組み込みと同じように一覧に出ます。保存先はこのブラウザのlocalStorageだけで、別のマシンへはJSONの書き出し／読み込みで移します。

![自作テンプレート](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/11-custom-template.png)

### プレースホルダー

結果の波括弧ボタンをクリックします。モデルが再利用できる断片を最大5個見つけ、`{{variables}}` として書き換えます。

![プレースホルダー](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/03-variables.png)

"Write back" を押すと変数付きの版が入力欄に入るので、再利用時に変えるのは値だけです。

### 反復

"Iterate" に切り替え、変更を1つ伝えます（例:「トーンをもう少し軽くして、確認待ちリストを3行にまとめて」）。関係する箇所だけが動きます。

![反復](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/08-iterate.png)

### 履歴と比較

時計のボタンで履歴を開きます。各行にはバージョン、テンプレート、文字数の増減が並び、展開するとコピー、復元、比較、削除ができます。

![履歴](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/06-history.png)

![比較](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/07-compare.png)

### 中国語のUI

中国語ロケールでは、同じパネル、テンプレート、ボタンがローカライズされます。

![中文界面](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/02-panel.png)

## テンプレート

用途ごとに分かれた15個の組み込みテンプレートです。詳しい説明は [docs/TEMPLATES.ja.md](./docs/TEMPLATES.ja.md) にあります。

| テンプレート | モード | グループ | 用途 |
| --- | --- | --- | --- |
| Task brief | Prompt | 基本 | 「Xを手伝って」系のほとんどの下書き |
| Delivery contract | Prompt | 構成 | 受け入れ基準を明示した作業 |
| Structured extraction | Prompt | 構成 | 資料から決まった項目を安定して取り出す |
| Worked examples | Prompt | 例示 | サンプルでスタイルや書式を固定したい場合 |
| Reasoning steps | Prompt | 推論 | 中間チェックを挟む多段の分析 |
| Grounded Q&A | Prompt | 推論 | 与えた資料に基づいて引用付きで回答 |
| Code review | Prompt | エンジニアリング | 範囲と優先度を決めたコードレビュー |
| Implementation task | Prompt | エンジニアリング | 受け入れ条件・インターフェース・境界を含む実装依頼 |
| SQL query | Prompt | エンジニアリング | 指標定義・項目・性能制約を明示した抽出 |
| Test design | Prompt | エンジニアリング | 正常・境界・異常・権限を網羅するケース |
| Translation | Prompt | 文章 | 読み手・用語集・書式を指定した翻訳 |
| Copy polish | Prompt | 文章 | どこまで直してよいか、勝手に足さない |
| Role contract | System | 基本 | 長く使う役割の制約 |
| Agent persona | System | 基本 | 語り口と判断の癖 |
| Incremental edit | Iterate | 反復 | あるバージョンへの小さな変更 |

テンプレートはパネル内で切り替えられます。切り替えると、現在の結果を黙って上書きする代わりに、フッターに "rerun with new template" が表示されます。同じメニューから自作テンプレートの作成とJSONの書き出し／読み込みもできます。

## ショートカット

| 操作 | キー |
| --- | --- |
| 実行 / 再実行 | `⌘ Enter`（Windows/Linuxでは`Ctrl Enter`） |
| 閉じる | `Esc`（メニュー → diff確認 → パネル） |
| 停止 | パネル内の "Stop" |

## プライバシー

- 履歴は既定でオフです。有効にした場合も、ブラウザの `localStorage` にだけ書き込まれます。
- プラグインが現在のモデルに送るのは、現在の下書き、反復の指示、テンプレートの内容だけで、履歴を送ることはありません。
- 履歴をオフにしても既存の行は残ります。削除するには "Clear" を使います。
- モデルを固定しても、影響するのはこのプラグインのリクエストだけで、セッションの既定モデルは変わりません。

## 既知の制限

- テキストのみ: 画像の添付はまだ書き換えの入力として受け付けません。
- 1回の下書きは60,000文字まで、取り出せる変数は最大5個です。
- システムプロンプト用のテンプレートはAPIにはありますが、パネルに表示されるのはPromptとIterateだけです。
- チェックは診断のみで、下書き自体は書き換えません。引用は10〜80文字の連続した範囲が必要なため、非常に短い下書きでは指摘が出ないことがあります。
- カスタムテンプレートはこのブラウザのlocalStorageにだけ保存されます。移行にはJSONの書き出し／読み込みを使ってください。
- 既定のモデルが必要です。使えない場合は、黙って失敗するのではなくパネルがはっきりと知らせます。

## 開発

```
src/spec.js          template metadata and queries
src/prompts.js       prompt construction per template
src/placeholders.js  variable parsing, anchoring and application
src/review.js        checkup parsing, validation and normalization
src/catalog.js       model and template catalog
src/index.js         host routes (models / optimize / variables / review)
src/web.js           client panel (React + theme tokens)
test/                node:test unit tests
```

- テスト: `npm test`
- ESMで、ビルド手順はなく、クライアント側にJSXは使いません。色はすべて `--dsw-alias-*` トークンから取ります。
- ホスト側のルート: `GET /prompt-optimize/models`、`POST /prompt-optimize/optimize`（NDJSON）、`POST /prompt-optimize/variables`。

## ライセンス

MIT。スクリーンショットは、このマシンで実際に動いているインスタンスから撮影したものです。
