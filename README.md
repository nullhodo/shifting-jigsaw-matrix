# shifting-jigsaw-matrix

M×N 行列状のジグソーパズル境界線が動的にシフト・スライド運動を繰り返すキネティック・ジェネラティブアート。

## 目次

1. [概要](#1-概要)
2. [仕組み](#2-仕組み)
3. [構造](#3-構造)
4. [実行方法](#4-実行方法)
5. [キーボードショートカット](#5-キーボードショートカット)
6. [ライブラリ選定と設計方針](#6-ライブラリ選定と設計方針)

## 1. 概要

境界線（水平・垂直）が独立してステップ移動・イージング移動を行い、出っ張り（タブ）の幾何形状やカラーパレットが動的に組み合わさるインタラクティブなキネティック・パズルシミュレーターです。
ウィンドウサイズに応じた自動最適な行列数算出による正方形に近いピース配置、1:1ピースアスペクト比維持オプション、透過グラスモルフィズムによるパラメータ調整パネル、60fps MP4 動画録画 (WebCodecs + mp4-muxer)、高解像度 PNG / SVG ベクター出力、Undo / Redo 履歴管理、正確な N ループ自動録画機能を備えています。

## 2. 仕組み

- 言語: TypeScript
- フレームワーク: React 18
- 状態管理: Jotai
- UIアニメーション: Framer Motion
- アイコン: Lucide React
- 描画エンジン: p5.js, p5.js-svg
- スタイリング: TailwindCSS
- ビルドツール: Vite
- パッケージマネージャー: pnpm
- コード品質 / フォーマッター: Biome
- テストフレームワーク: Vitest
- 動画録画: WebCodecs + mp4-muxer (60fps H.264 MP4 直接出力、MediaRecorder フォールバック)

## 3. 構造

```text
shifting-jigsaw-matrix/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── biome.json
├── .gitignore
├── README.md
├── output/                     - 出力画像・録画動画・JSON設定ファイルの保管先 (gitignore対象)
└── src/
    ├── main.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── types/
    │   └── jigsaw.ts           - パラメータ・境界線・幾何形状・録画の型定義
    ├── constants/
    │   ├── palettes.ts         - 24種類のプリセットカラーパレット定義
    │   └── defaults.ts         - 初期パラメータ・ランダム対象フラグの既定値
    ├── core/
    │   ├── geometry.ts         - タブの幾何ベジェ計算・アスペクト比制限
    │   ├── motion.ts           - 3次加減速イージング・境界線の確率的動的シフト移動計算
    │   ├── jigsawRenderer.ts   - パズル描画・セル色分け・出っ張りクリップフィル・枠線・グレインノイズ
    │   ├── recorder.ts         - WebCodecs + mp4-muxer による 60fps MP4 録画マネージャー
    │   └── exporter.ts         - 高解像度 PNG / SVG / JSON 保存・読み込み
    ├── state/
    │   └── jigsawStore.ts      - Jotai による状態管理 (パラメータ、グリッド、履歴、録画状態)
    ├── hooks/
    │   ├── useKeyboardShortcuts.ts - グローバルキーボードショートカット
    │   ├── useJigsawHandlers.ts - パラメータ操作・Undo/Redo・パレット更新ハンドラー
    │   └── useWheelRangeSlider.ts - スライダーのマウスホイールスクロール制御
    ├── components/
    │   ├── ControlPanel.tsx    - グラスモルフィズム設定パネルコンテナ
    │   ├── RecordingOverlay.tsx - 録画中ステータス・N-Loop進行状況 HUD
    │   └── sections/
    │       ├── GridScaleSection.tsx    - グリッド列・行数・タブ形状スタイル設定
    │       ├── MotionSection.tsx       - 活動確率・判定間隔・イージング時間・線幅設定
    │       ├── ColorPaletteSection.tsx - パレット選択・単色モード・グラデーション生成
    │       ├── EffectsSection.tsx      - グレインノイズ質感・デバッグオーバーレイ
    │       ├── AutomationSection.tsx   - 即時ランダム・自動サイクル・N-Loop録画
    │       └── ExportSection.tsx       - PNG / SVG / MP4 / JSON 保存・読み込み
    └── tests/
        ├── geometry.test.ts    - タブ幾何計算・アスペクト比制限の単体テスト
        ├── motion.test.ts      - イージング関数・境界線移動計算の単体テスト
        └── palettes.test.ts    - カラーパレット構造・隣接セル色非重複制約の単体テスト
```

## 4. 実行方法

| コマンド | 実行内容 |
| -- | -- |
| `pnpm install` | 依存パッケージのインストール |
| `pnpm dev` | 開発サーバーの起動 (ローカル実行) |
| `pnpm build` | TypeScript 型チェックおよび本番バンドルビルド |
| `pnpm test` | Vitest による単体テストの実行 |
| `pnpm check` | Biome による静的解析とフォーマット確認 |
| `pnpm format` | Biome によるコードの自動フォーマット |

## 5. キーボードショートカット

| キー | 動作 |
| -- | -- |
| `Space` | 選択された対象パラメータのランダム実行 |
| `H` | ツール設定パネルの表示 / 非表示切り替え |
| `Ctrl+Z` | 直前のパラメータ状態に戻す (Undo) |
| `Ctrl+Y` | やり直す (Redo) |
| `R` | 60fps MP4 動画録画の開始 |
| `S` | 動画録画の停止・保存 |
| `P` | 高解像度 PNG 画像 (2880px) + JSON の保存 |
| `D` | デバッグ情報オーバーレイの表示切り替え |

## 6. ライブラリ選定と設計方針

- **mp4-muxer**: WebCodecs の VideoEncoder と組み合わせることで、従来の WebM 形式だけでなく、ブラウザから直接 60fps H.264 MP4 ファイルを出力可能にしています。
- **Jotai + Framer Motion**: パラメータ変更の高速な伝播と、滑らかで心地よいグラスモルフィズム UI アニメーションを両立しています。
- **p5.js v1.9.0 + p5.js-svg**: p5.js v2 における SVG 出力ライブラリの非互換性リスクを回避するため、安定実績のある v1.9.0 を採用しています。
- **Vitest**: タブのベジェ曲線計算やイージング補間、隣接セルの色非重複ロジックを純粋関数として分離し、網羅的なユニットテストを高速実行できるようにしています。
- **TailwindCSS の採用と Open Props / Storybook の見送り**: スタイリングは TailwindCSS で一元管理し、単一アプリとして最小限のビルド構成を維持するため Open Props や Storybook はあえて導入せず、軽量で高速な開発体験を優先しています。
