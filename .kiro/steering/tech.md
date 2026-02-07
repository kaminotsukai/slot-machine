# 技術スタック

## コア技術

- **TypeScript 5.0+**: 型安全性とコード品質の確保
- **Webpack 5**: モジュールバンドリングと開発サーバー
- **Jest**: テストフレームワーク
- **fast-check**: プロパティベーステスト（PBT）ライブラリ

## TypeScript 設定

### 厳格な型チェック

プロジェクトは TypeScript の厳格モードを有効化しています：

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

### ターゲット環境

- **Target**: ES2020
- **Module**: CommonJS
- **Lib**: ES2020, DOM

## ビルドシステム

### Webpack 設定

- **エントリポイント**: `src/index.ts`
- **出力**: `dist/bundle.js`
- **開発サーバー**: ポート 8080
- **プラグイン**:
  - HtmlWebpackPlugin: HTML 自動生成
  - CopyWebpackPlugin: CSS ファイルのコピー
  - ProvidePlugin: process ポリフィル

## テスト環境

### Jest 設定

- **プリセット**: ts-jest
- **環境**: jsdom（ブラウザ環境のシミュレーション）
- **テストパターン**: `**/__tests__/**/*.ts`, `**/*.test.ts`
- **カバレッジ**: src ディレクトリ全体（テストファイルを除く）

### プロパティベーステスト

- **ライブラリ**: fast-check
- **用途**: 普遍的なプロパティの検証
- **統合**: Jest テストスイート内で実行

## コード品質

### Prettier

- **設定ファイル**: `.prettierrc`
- **対象**: TypeScript, JavaScript, JSON, CSS, Markdown
- **コマンド**:
  - フォーマット: `npm run format`
  - チェック: `npm run format:check`

## よく使うコマンド

### 開発

```bash
# 開発サーバー起動（ブラウザ自動オープン）
npm start

# 開発サーバー起動（手動）
npm run dev

# 開発ビルド
npm run build:dev

# 本番ビルド
npm run build
```

### テスト

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### コード品質

```bash
# コードフォーマット
npm run format

# フォーマットチェック
npm run format:check
```

## 依存関係管理

- **パッケージマネージャー**: npm
- **Node.js バージョン**: 16 以上推奨
- **ロックファイル**: package-lock.json（コミット必須）
