# 箱ドロップ保管シミュレーター / Box Drop Storage Simulator

箱のドロップ・自動開封・保管完了までの所要時間を計算するシミュレーター。
日本語・英語の2言語対応、ライト／ダークモード対応、**依存ライブラリゼロ**の静的Webアプリ。

A simulator for box drop, auto-open, and storage-completion timing.
Bilingual (Japanese / English), light & dark themes, **zero runtime dependencies**.

🌐 **公開ページ / Live demo:** https://tomonorarari-think.github.io/box-drop-simulator/

> 公開ページは GitHub Pages の有効化後に表示されます（手順は下記「公開方法」参照）。
> The live page goes online once GitHub Pages is enabled — see "Publishing" below.

---

## 構成 / Structure

```
box-drop-simulator/
├─ index.html          ← エントリポイント（ルート配置・Pages対応）
├─ styles.css          ← ゲームHUD風デザイン（ネオン／グラスモーフィズム、ライト・ダーク）
└─ js/
   ├─ i18n.js          ← 多言語リソース（ja / en）
   ├─ simulation.js    ← シミュレーションコア（純粋関数・Nodeでもテスト可）
   ├─ formatters.js    ← 時間・数値フォーマット
   ├─ charts.js        ← SVG グラフ描画（依存なし）
   └─ app.js           ← UI 配線
```

外部ライブラリ・CDN・ビルド工程は一切ありません（自前のバニラ JS のみ）。

---

## 実行方法 / How to run

`index.html` を **ダブルクリック**するだけ。既定のブラウザで開きます。
ビルドもサーバーも不要。ES Modules や `fetch` を使っていないため `file://` で完全に動作し、**オフラインでも動きます**。

> Just double-click `index.html`. No build, no server, works offline from `file://`.

---

## 機能 / Features

- **基本パラメーター**: ステージクリア間隔 / 白箱・青箱クールタイム / 白箱・青箱**開封時間** / インベントリ上限 / 白箱・青箱保管上限
- **ルール設定**（各項目に `?` ツールチップ付き）
  - クールダウンリセット方式（ドロップ時リセット / 固定間隔）
  - 同時ドロップ時の優先（白優先 / 青優先）
  - 1クリアあたりの最大ドロップ数（1個 / 2個）
  - 初回ドロップの扱い（フルクールダウン必要 / 即ドロップ可）
  - 非選択側の扱い（待機のまま / クールダウンリセット）
  - 保管終了条件（いずれか片方 / 両方）
- **結果サマリー**: インベントリ満杯までの時間 / 箱保管の追加時間 / 開封合計時間 / 合計時間 / 白・青保管数 / 先に上限到達した箱（ハイライト表示）
- **時間表示**: 「X時間Y分Z秒（NN,NNN秒）」/「Xhr Ymin Zsec (NN,NNN sec)」
- **可視化**: 進捗フェーズのタイムライン＋保管数推移の SVG 折れ線グラフ
- **言語切替**: 即時反映、選択は次回起動時も保持（localStorage）
- **テーマ**: ライト／ダーク切替（既定はダーク）
- 1画面に収まるコンパクトなレイアウト。入力値・言語・テーマはローカルに保存され、再起動後も復元

### 開封時間の扱い / How opening time is modeled

開封時間は、**インベントリに入る箱（自動開封される箱）のみ**に加算されます。
保管された箱は開封されないため加算されません（保管 = 未開封）。

- 開封の追加時間はすべて「インベントリ充填フェーズ」で発生します
- そのため開封時間を増やすと「満杯までの時間」「合計時間」は延びますが、満杯後の「保管追加時間」は変わりません
- 開封時間を `0` にすれば従来どおりの挙動になります

---

## シミュレーションロジック / Simulation logic

`js/simulation.js` の `simulate(params)` は純粋関数（入力を変更しない）で、Node からも利用・テスト可能です。

```js
const sim = require('./js/simulation.js');
const result = sim.simulate({ stageInterval: 205, whiteCooldown: 300, whiteOpenTime: 5 /* ... */ });
```

無限ループ防止のため最大 5,000,000 ステージで打ち切り、その場合は `completed: false` を返します。

---

## 公開方法 / Publishing (GitHub Pages)

このアプリは完全クライアントサイド（サーバー処理なし）なので **GitHub Pages** で公開できます。
ファイルはルート（`index.html`）に配置済みなので、**設定を1回ONにするだけ**です。

1. リポジトリの **Settings → Pages** を開く
2. **Build and deployment → Source** を `Deploy from a branch` にする
3. **Branch** を `main` / `/ (root)` に設定して **Save**
4. 数十秒後、以下のURLで公開されます:

   **https://tomonorarari-think.github.io/box-drop-simulator/**

> ⚠️ github.com 上で `index.html` を直接開いてもソース表示になるだけで動きません。
> 必ず GitHub Pages のURLから開いてください（計算は各ユーザーのブラウザ内でローカル実行されます）。

---

## ライセンス / License

本プロジェクトは **MIT License** で公開しています。詳細は [LICENSE](./LICENSE) を参照してください。

This project is released under the **MIT License** — see [LICENSE](./LICENSE).

### サードパーティライセンス / Third-party licenses

本アプリは**外部ライブラリ・フレームワーク・CDN・Webフォントを一切使用していません**
（自作のバニラ HTML/CSS/JavaScript のみ、フォントはOS標準フォントを利用）。
そのため同梱すべきサードパーティライセンスはありません。

This app uses **no third-party libraries, frameworks, CDNs, or web fonts**
(only hand-written vanilla HTML/CSS/JS, with system fonts), so there are no
third-party licenses to bundle.

---

アプリ内・ソース内に特定のゲーム名は含めていません（汎用的な「箱ドロップ保管シミュレーター」表記）。
