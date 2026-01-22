# ExpandEmbeds - Obsidian埋め込み展開ツール

Obsidianの埋め込み記法を展開し、単一のREADME.mdファイルを生成するTemplaterスクリプトです。

## 📁 ディレクトリ構造

```
src/obsidianScripts/expandEmbeds/
├── index.js                # メインエントリーポイント
├── config.js               # 設定ファイル
├── contextUtils.js         # コンテキスト取得
├── pathUtils.js            # パス処理ユーティリティ
├── templaterProcessor.js   # Templaterタグ処理
├── embedExpander.js        # 埋め込み展開ロジック
├── fileManager.js          # ファイル管理
└── README.md              # このファイル
```

## 🚀 使い方

### 基本的な使用方法

ノートに以下のTemplaterタグを追加:

```
<%* await tp.user.expandEmbeds(tp) %>
```

### 対応する埋め込み記法

- **Wikilink形式**: `![[ファイル名]]`
- **Markdown形式**: `![タイトル](パス)`
- **画像埋め込み**: `![](パス)`

### Templaterタグの展開

日付フォーマットも自動的に展開されます:

```
<% tp.date.now("YYYY-MM-DD") %>
```

## ⚙️ 設定

`config.js`で以下の設定が可能:

- `MAX_DEPTH`: 再帰処理の最大深度（デフォルト: 5）
- `EXT`: マークダウンファイルの拡張子（デフォルト: ".md"）
- `OUTPUT`: 出力ファイル名（デフォルト: "README.md"）

## 📦 モジュール構成

### config.js

アプリケーション全体の設定を管理します。

### contextUtils.js

Templaterコンテキストから必要な情報（vault、app、現在のファイル等）を取得します。

### pathUtils.js

- `dirname()`: パスからディレクトリ部分を取得
- `resolvePath()`: 相対パスを解決
- `findFile()`: ファイルを検索

### templaterProcessor.js

- `removeExpandTag()`: expandEmbedsタグを除去
- `processTemplaterTags()`: 日付フォーマット等のTemplaterタグを処理

### embedExpander.js

- `expandEmbeds()`: 埋め込みを再帰的に展開
- `parseLinkPath()`: リンクパスを解析

### fileManager.js

- `createReadme()`: README.mdファイルを作成（既存ファイルがあれば上書き）

### index.js

全モジュールを統合し、メインの処理フローを実行します。

## 🔄 処理フロー

1. コンテキスト取得
2. expandEmbedsタグの除去
3. 埋め込みの再帰的展開
4. Templaterタグの処理
5. README.mdの生成

## ⚠️ 注意事項

- 自己参照は自動的にスキップされます
- 最大深度を超えた場合、それ以上の展開は行われません
- ファイルが見つからない場合、元の埋め込み記法が保持されます

## 🐛 デバッグ

全ての処理はコンソールログに記録されます。開発者ツールで確認できます。
