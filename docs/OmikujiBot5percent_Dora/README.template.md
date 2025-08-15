# どこでもドラちゃん Bot OmikujiBot 5percent_Dora

最終更新日：<% tp.date.now('YYYY/MM/DD') %>

![](../../template/intro/intro_11.md) ジェネレーター BOT 「おみくじ BOT」のデータを編集できるアプリです。

![](../../template/intro/intro_12.md) [どこでもドラちゃん Bot OmikujiBot 5percent_Dora](https://pintocuru.booth.pm/items/7291931)![](../../template/intro/intro_13.md)

![](../../template/intro/intro_21_hazimeni)

## このテンプレートは何？

![](images/default.webp)

### 「ドラちゃん」を名乗るキャラクターが「ひみつ道具」をランダムに出してくれるジェネレーター

- わんコメに BOT 機能を付与するジェネレーター【おみくじ BOT】を使った、コメントや 30 分ごとに自動でつぶやいてくれる、ジェネレーター BOT です。
![features_21_](../../template/features/features_21_.md)

## インストール方法

![Installation_41_GotoTemplate](../../template/installation/Installation_41_GotoTemplate.md)

![Installation_42_OmikujiWordParty](../../template/installation/Installation_42_OmikujiWordParty.md)

## つかいかた

![](images/250816_1.jpg)

! ここから途中＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞＞

解説配信でも良く使われる、「ゆっくり霊夢」「ゆっくり魔理沙」を BOT キャラクターにしました。「おみくじ」BOT らしく " 博麗神社の巫女 " が、おみくじの結果を教えてくれます。

- **朝活配信**
	- 今日 1 日の運勢を占う「おみくじ」で、配信が賑やかに。
- **雑談配信**
	- リスナーのコメントに対してキャラクターがボケたりツッコミを入れたりして、自然に会話が広がります。
- **ゲーム配信**
	- ゲームに集中していても、BOT が代わりに挨拶してくれるので、初見さんを見逃しません。

### 設定の保存方法

仕様上、コンフィグエディターは途中の保存が行えません。閉じたりリロードすると内容が消えてしまうため、保存は注意深く行ってください。

**内容の反映のさせ方**

1. 「設定を出力 (js)」ボタンを押すと、ブラウザから「omikujiData.js」というファイルが保存されます。
2. コンフィグエディターと同じフォルダに、ダウンロードした「omikujiData.js」を上書き保存します。

### テンプレート出力 (json) :wip

Json データとして保存が可能になります。バックアップの際にお使いください。再配布はご遠慮ください。詳細は書きたいな。

### テンプレート読み込み (json) :wip

有料版の Json ファイルをお持ちの場合、ここから読み込みます。

ファイルを読み込むと、それぞれどのデータを読み込むかを選択できます。

- すべて追加：新しいデータを、現在のデータに追加します。
- データを上書き：現在のデータをすべて消去し、新しいデータに置き換えます。
- 個別に設定：任意の項目に対し、追加・上書きを選択します。

## よくある質問 (FAQ)

### データがあるのに一致するルールが見つかりませんでした。と出る

フィルターがかかっている際に他のカテゴリへ移動すると、

![](images/Pasted%20image%2020250815065458.png)

### プレースホルダー

コメントやタイマーで利用できる、高性能なプレースホルダーを設定します。複数の内容を入力でき、それぞれ重さを設定できます。

![](images/Pasted%20image%2020250815065526.png)

### キャラクター(カラー設定)

BOT メッセージのキャラクターや吹き出し・トーストの色を設定します。

![](images/Pasted%20image%2020250815065631.png)

### ゲームスクリプト

ゲームのモードや、ランキングの上限回数等の初期設定を行います。

### 表示設定

メッセージの文字の大きさや、トーストの表示設定を行います。

![](images/Pasted%20image%2020250815065801.png)

### WordParty リスト

コメントやタイマー設定時に利用できる、WordParty の発動リストを管理します

### Meta タグ

このおみくじデータのメタ情報を設定します

---

作成者：せすじピンとしてます @pintocuru

[Twitter](https://twitter.com/pintocuru) | [YouTube](https://www.youtube.com/@pintocuru)

<%* await tp.user.expandEmbeds(tp) %>