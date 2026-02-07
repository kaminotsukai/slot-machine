# プロジェクト構造

## ディレクトリ構成

```
src/
├── types/              # 型定義と列挙型
│   └── index.ts        # GameState, Symbol, SpinResult, WinResult など
├── interfaces/         # コンポーネントインターフェース定義
│   ├── GameEngine.ts
│   ├── ReelManager.ts
│   ├── WinEvaluator.ts
│   ├── StateManager.ts
│   ├── UserInterface.ts
│   └── index.ts
├── StateManager.ts     # ゲーム状態管理
├── ReelManager.ts      # リール管理とシンボル生成
├── WinEvaluator.ts     # 勝敗判定ロジック
├── GameEngine.ts       # ゲームエンジン（コアロジック）
├── UserInterface.ts    # UI レンダリングとイベント処理
├── __tests__/          # テストファイル
│   ├── *.test.ts       # ユニットテスト
│   ├── integration.test.ts  # 統合テスト
│   └── setup.test.ts   # テストセットアップ検証
├── test-setup.ts       # Jest セットアップファイル
└── index.ts            # メインエントリポイント
```

## ファイル命名規則

### 実装ファイル

- **コンポーネント**: PascalCase（例: `GameEngine.ts`, `ReelManager.ts`）
- **型定義**: PascalCase（例: `types/index.ts`）
- **インターフェース**: PascalCase（例: `interfaces/GameEngine.ts`）

### テストファイル

- **ユニットテスト**: `*.test.ts`（例: `GameEngine.test.ts`）
- **配置**: `src/__tests__/` ディレクトリ内
- **命名**: 対応する実装ファイル名 + `.test.ts`

## アーキテクチャパターン

### レイヤー構造

1. **型レイヤー** (`types/`): 共通の型定義と列挙型
2. **インターフェースレイヤー** (`interfaces/`): コンポーネントの契約定義
3. **実装レイヤー** (ルート): 具体的なコンポーネント実装
4. **統合レイヤー** (`index.ts`): アプリケーション全体の統合

### コンポーネント依存関係

```
SlotMachineApp (index.ts)
├── GameEngine
│   ├── StateManager
│   ├── ReelManager
│   └── WinEvaluator
└── UserInterface
```

### 責任分離

- **StateManager**: ゲーム状態の遷移ロジックのみ
- **ReelManager**: リールの回転・停止とシンボル管理のみ
- **WinEvaluator**: 勝敗判定ロジックのみ
- **GameEngine**: 上記コンポーネントのオーケストレーション
- **UserInterface**: DOM 操作とイベント処理のみ

## インポート規則

### 推奨インポート順序

1. 外部ライブラリ（例: `fast-check`）
2. 型定義（例: `./types`）
3. インターフェース（例: `./interfaces`）
4. 実装コンポーネント（例: `./StateManager`）

### エクスポートパターン

- **型とインターフェース**: `types/index.ts` と `interfaces/index.ts` から再エクスポート
- **実装**: 各コンポーネントファイルから直接エクスポート
- **メインエントリ**: `index.ts` からすべてを再エクスポート

## 設定ファイル

### ルートディレクトリ

- `tsconfig.json`: TypeScript コンパイラ設定
- `jest.config.js`: Jest テスト設定
- `webpack.config.js`: Webpack ビルド設定
- `.prettierrc`: Prettier フォーマット設定
- `.prettierignore`: Prettier 除外設定
- `package.json`: プロジェクトメタデータと依存関係

### HTML/CSS

- `index.html`: アプリケーションのエントリ HTML
- `styles.css`: グローバルスタイル

## ビルド出力

- **ディレクトリ**: `dist/`
- **生成ファイル**:
  - `bundle.js`: バンドルされた JavaScript
  - `index.html`: 生成された HTML
  - `styles.css`: コピーされた CSS
- **クリーンビルド**: ビルド時に自動的にクリア
