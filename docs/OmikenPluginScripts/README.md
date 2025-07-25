# おみくじ BOT プラグイン のスクリプト (未完成)

最終更新日：2025/01/27

配信者のためのコメントアプリ「わんコメ」で使用できる、プラグイン です。

## このプラグインを利用するときは

- わんコメ (<https://onecomme.com/>) の利用規約に基づきます。
- わんコメの利用規約に基づき、プラグインに限っては商業利用も含め自由に利用することができます。
- 本プラグインの使用に伴ういかなる損害についても責任を負いません。ご利用は自己責任でお願いします。
- プラグインの仕様は予告なく変更される可能性があります。

## 1.このプラグインは何？

![](Editor/readme_01.jpg)

### 🎯1-1.自動返信してくれる BOT で、わんコメの配信をもっと楽しく

おみくじ BOT プラグイン OmikenPlugin は、わんコメのプラグインとして動作する拡張機能です。BOT を通じて配信者とリスナーの双方向のやり取りを促進し、より魅力的な配信作りをサポートします。

### ✨ 1-2.できること

![](Editor/readme_02.jpg)

1. **コメントに反応するおみくじシステム**
	- `おみくじ` で今日の運勢を表示
	- `おはよう` で「おはようカウンター」の回数を数える
	- じゃんけんやスイカジェネレーターなどのミニゲーム
2. **エディターで多彩なおみくじを自作できる**
	- おみくじの内容を自由に編集
	- フキダシの色替えも自由自在
	- 設定した内容はすぐに反映
3. **初見ありがとう！から久しぶり！まで判定する「初見判定ちゃん」**
	- はじめまして！がわかる「初見判定機能」
	- 「初見詐欺」を見破る機能も搭載
4. **ギフト・スーパーチャットへお礼できる機能**
	- 「〇〇さん、ギフトありがとうございます！」
	- 金額に応じた特別なメッセージ設定
	- コメントではなく、ギフトでおみくじを設定することも可能
5. **チャンネル登録お願い！「告知タイマー機能」**
	- SNS やファンクラブの告知も自動投稿
	- 投稿間隔も 1 分単位で自由に設定可能

## 2.導入方法

### 2-1. わんコメに「おみくじ BOT プラグイン」を追加する

![](Editor/readme_03.jpg)

1. おみくじ BOT プラグイン OmikenPlugin <https://booth.pm/ja/items/5471598> をダウンロード
2. わんコメの右上【…】（三点リーダー）から「プラグイン」を選択
3. 「プラグインフォルダ」を選択
4. ダウンロードした zip ファイルを解凍し、「OmikenPlugin01」フォルダを入れる

### 2-2. プラグイン対応のジェネレーターをわんコメに追加する

1. 上記の解凍したファイルに「OmikenTemplate.zip」があることを確認
2. わんコメの右上【…】（三点リーダー）から「テンプレート」を選択
3. ファイルアイコンをクリックし、上記の zip ファイル（解凍不要）を選択

### 2-3. ジェネレーターを OBS に追加する

![](Editor/readme_04.jpg)

1. わんコメの右上【…】から「テンプレート」を選択
2. 「カスタム」タブから、ジェネレーターを見つける。
3. 「ここをドラッグして OBS に入れる」の指示に従い、テンプレートを OBS のソースに追加

### 2-4. OBS の設定・プロパティを変更する

![](Editor/readme_05.jpg)

1. テンプレートの名称変更
	- 追加したテンプレート「index.html」という名称を、わかりやすい名前（例：おみくじ BOT 等）に変更。
2. テンプレートのプロパティを編集
		- 「幅」「高さ」については、適切に設定してください。目安は幅 550、高さ 800
		- 表示サイズの調整が必要な場合は、適時拡大縮小するなどで調整して下さい。

## 3.プラグインの使い方

![](Editor/readme_03.jpg)

### 3-1. プラグインを起動する

1. わんコメの右上にある【…】（三点リーダー）をクリックし、**「プラグイン」**を選択
2. 「おみくじ BOT プラグイン」の右にあるスイッチを ON にする
3. 【おみくじ BOT プラグイン】が起動したよ　というコメントが出ていれば、起動できています。

万が一　「【おみくじ BOT プラグイン】の初期化に失敗」　と出たときは、ご報告ください。

### 3-2. プラグインをテストする

- 下記の内容は、初期状態であることが前提です。

1. わんコメの右上にある【…】（三点リーダー）をクリックし、**「コメントテスター」**を選択
2. コメントテスターにて、コメントに「おみくじ」と入力して送信する
3. 反応があれば成功です。

### 3-3.プラグインを配信で使用する

1. プラグイン単体でも使用可能ですが、付属している「OmikenTemplate」、別ページで配布している「[おみくじBOT用 word-party](https://pintocuru.booth.pm/items/6048048)」を使用すると、より使用感が増します。

## 4.おみくじメーカーによるカスタマイズ

![](Editor/readme_06.jpg)

- editor.html から、おみくじの編集を行います
- 詳細は、別途「ReadMe_ おみくじメーカー.md」を御覧ください。
- 編集する際は、**必ずわんコメは起動したまま**にしてください。わんコメを閉じると、保存が行えません。

## 5.よくある質問

  わんコメの機能については [よくある質問](https://onecomme.com/docs/faq) または [導入ガイド](https://onecomme.com/docs/guide) をご参照ください。

### 5-1.設定・音声関連

#### Q. BOT のコメントが、Youtube のコメントに反映されていない

A: 仕様であり、BOT のコメントはわんコメアプリ内でのみ表示されます。YouTube や Twitch のチャットには投稿されません。

#### Q. おみくじメーカーでカスタマイズした設定が反映されない

A: おみくじメーカーの右上にある 「わんコメへ保存」は必ず押してください。これを押さないと、編集が反映されません。また、必ずわんコメは起動したままにしてください。

### おみくじ関連

#### Q. おみくじが反映されない

A: おみくじの結果が表示されない場合は、以下の点をご確認ください。

1. わんコメの起動確認: わんコメが正常に起動しているかご確認ください。
2. わんコメがコメントを正しく拾えているか

![](Editor/readme_07.jpg)

#### Q. おみくじをメンバー限定にしたい

A: メンバー限定にするには、おみくじメーカーの「条件設定」で「メンバー」を設定してください。

#### Q. おみくじの内容は変更しても OK？

A: はい、おみくじの内容は自由に変更していただいて構いません。

![](Editor/readme_08.jpg)

#### Q. じゃんけんの勝率低すぎない？

A: これでも高い方です。ケイスケ ホンダはもっと強いです。

詳細 : <https://dic.pixiv.net/a/%E6%9C%AC%E7%94%B0%E3%81%A8%E3%81%98%E3%82%83%E3%82%93%E3%81%91%E3%82%93>

### トラブルシューティング

#### Q. おみくじを連続で行うとコメントが反映されなくなる

A: おみくじを短時間に何度も行うと、配信プラットフォームの自動規制（ソフト BAN）により、コメントが反映されなくなることがあります。

#### Q. おみくじメーカーでタイマーを設定したが、反映されない

#### Q. 再読み込みを行うと、タイマーが二重三重に表示されてしまう

A: タイマー機能については、開発中です。不具合が起きた場合、わんコメを再起動してください。

#### Q. 複数視聴者の同時コメントで結果が表示されない

A: 「コメントが表示されない」ケースが報告されています。原因は究明中ですが、もしよければ、報告をいただければと思います。

---

## 6.クレジット：イラストと音源について

おみくじメーカーや WordParty、アイコンで使用しています。

- **じゃんけんプレートのイラスト**: [ツカッテ](https://tsukatte.com/rock-paper-scissors_plate/)
- **ガムイラスト**: [イラストくん](https://illustkun.com/07358-20230417-b/)
- **各種効果音**: [効果音ラボ](https://soundeffect-lab.info/)
- **細かい部品のほとんど**: [ダーヤマ TOPECONHEROES](https://twitter.com/topeconheroes)

### 素材の取り扱いについて

- イラスト素材、動画、音源の再配布は禁止です。
- 使用にあたっては、各配布サイトの利用規約をご確認ください。

## バージョン情報

### v0.2.0 25/01/27

- ジェネレーターをメイン/トースト表示と分けていたのを、1 つに統合しました。
- 一部おみくじの表示がおかしかったのを修正

### v0.1.0 25/01/24

- [初見判定ちゃん ゆっくり霊夢&ゆっくり魔理沙](https://booth.pm/ja/items/5471598) の内容を基に、プラグインとして開発。

---

作成者：せすじピンとしてます @pintocuru

[Twitter](https://twitter.com/pintocuru) | [YouTube](https://www.youtube.com/@pintocuru)