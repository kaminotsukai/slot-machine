/**
 * スロットマシンアプリケーションのメインエントリポイント
 *
 * このファイルは以下を担当します：
 * - すべてのコンポーネント（GameEngine、UserInterface）の接続
 * - アプリケーションの初期化と起動
 * - 適切なコンポーネントライフサイクル管理
 *
 * 要件: 1.1, 1.2, 1.3
 */

// Export all types and interfaces for external use
export * from './types';
export * from './interfaces';

// Export implemented components
export { StateManager } from './StateManager';
export { ReelManager } from './ReelManager';
export { WinEvaluator } from './WinEvaluator';
export { GameEngine } from './GameEngine';
export { UserInterface } from './UserInterface';

import { GameEngine } from './GameEngine';
import { UserInterface } from './UserInterface';
import { GameState } from './types';

/**
 * SlotMachineAppクラス
 * アプリケーション全体を管理し、GameEngineとUserInterfaceを統合します
 */
export class SlotMachineApp {
  private gameEngine: GameEngine;
  private userInterface: UserInterface;
  private isInitialized: boolean = false;

  /**
   * SlotMachineAppのコンストラクタ
   * @param containerId UIを配置するコンテナ要素のID（デフォルト: 'slot-machine-container'）
   */
  constructor(containerId: string = 'slot-machine-container') {
    // GameEngineを初期化
    this.gameEngine = new GameEngine();

    // UserInterfaceを初期化
    this.userInterface = new UserInterface(containerId);
  }

  /**
   * アプリケーションを初期化して起動します
   *
   * 初期化処理：
   * 1. 初期状態の確認（要件1.3: 待機状態）
   * 2. 空のリールを表示（要件1.1）
   * 3. スピンボタンを有効化（要件1.2）
   * 4. 停止ボタンを無効化（初期状態）
   * 5. イベントハンドラの設定
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('アプリケーションは既に初期化されています');
      return;
    }

    // 要件1.3: ゲーム状態が待機中であることを確認
    const currentState = this.gameEngine.getCurrentState();
    if (currentState !== GameState.IDLE) {
      console.error(`初期状態が不正です。期待: ${GameState.IDLE}, 実際: ${currentState}`);
      return;
    }

    // 要件1.1: 初期状態で3つの空のリールを表示
    // 初期表示用のプレースホルダーシンボルを作成
    const placeholderSymbols = [
      { id: 'placeholder', name: 'プレースホルダー', displayValue: '?' },
      { id: 'placeholder', name: 'プレースホルダー', displayValue: '?' },
      { id: 'placeholder', name: 'プレースホルダー', displayValue: '?' },
    ];
    
    // 各リールに3つのプレースホルダーを表示
    const placeholderSets = [
      [placeholderSymbols[0]!, placeholderSymbols[1]!, placeholderSymbols[2]!],
      [placeholderSymbols[0]!, placeholderSymbols[1]!, placeholderSymbols[2]!],
      [placeholderSymbols[0]!, placeholderSymbols[1]!, placeholderSymbols[2]!],
    ];
    this.userInterface.displayReelSymbolSets(placeholderSets);

    // 要件1.2: スピンボタンを有効状態で表示
    this.userInterface.displaySpinButton(true);

    // 停止ボタンを無効状態で表示
    this.userInterface.displayStopButtons([false, false, false]);

    // スピンボタンのクリックイベントハンドラを設定
    this.userInterface.onSpinButtonClick(() => this.handleSpin());

    // 停止ボタンのクリックイベントハンドラを設定
    this.userInterface.onStopButtonClick(reelIndex => this.handleStopReel(reelIndex));

    this.isInitialized = true;
    console.log('✅ スロットマシンアプリケーションが初期化されました');
    console.log(`📊 利用可能なシンボル: ${this.gameEngine.getSymbols().length}種類`);
  }

  /**
   * スピン処理を実行します
   *
   * スピンフロー：
   * 1. スピンボタンを無効化（要件2.2）
   * 2. スピンアニメーションを開始（要件2.3）
   * 3. GameEngineでスピンを開始
   * 4. すべての停止ボタンを有効化（要件2.4）
   * 5. リールの現在のシンボルを表示（目押し用）
   */
  private async handleSpin(): Promise<void> {
    try {
      // スピンが可能かチェック
      if (!this.gameEngine.canSpin()) {
        console.warn('現在スピンできません');
        return;
      }

      // 要件2.2: スピンボタンを無効化
      this.userInterface.displaySpinButton(false);

      // 要件2.3: スピンアニメーションを開始
      this.userInterface.startSpinAnimation();

      // GameEngineでスピンを開始
      this.gameEngine.initiateSpin();

      // 要件2.4: すべての停止ボタンを有効化
      this.userInterface.displayStopButtons([true, true, true]);

      // リールの現在のシンボルを定期的に更新（目押し用）
      this.startReelSymbolUpdates();

      console.log('🎰 スピン開始');
    } catch (error) {
      console.error('❌ スピン処理中にエラーが発生しました:', error);

      // エラー時もボタンを再有効化
      this.userInterface.displaySpinButton(true);
      this.userInterface.displayStopButtons([false, false, false]);

      // エラーメッセージを表示
      this.userInterface.displayResult({
        isWin: false,
        message: 'エラーが発生しました。もう一度お試しください。',
      });
    }
  }

  /**
   * リールの現在のシンボルを定期的に更新（目押し用）
   */
  private reelUpdateInterval: number | null = null;

  private startReelSymbolUpdates(): void {
    // 既存の更新を停止
    this.stopReelSymbolUpdates();

    // 100msごとにリールのシンボルを更新
    this.reelUpdateInterval = window.setInterval(() => {
      if (this.gameEngine.getCurrentState() === GameState.IDLE) {
        this.stopReelSymbolUpdates();
        return;
      }

      const symbolSets = this.gameEngine.getCurrentReelSymbolSets();
      this.userInterface.displayReelSymbolSets(symbolSets);
    }, 100);
  }

  private stopReelSymbolUpdates(): void {
    if (this.reelUpdateInterval !== null) {
      clearInterval(this.reelUpdateInterval);
      this.reelUpdateInterval = null;
    }
  }

  /**
   * リール停止処理を実行します
   *
   * @param reelIndex - 停止するリールのインデックス
   *
   * 停止フロー：
   * 1. 指定されたリールを停止（要件2.5）
   * 2. 停止したリールのボタンを無効化、他のリールは有効のまま（要件2.6）
   * 3. すべてのリールが停止したら勝敗判定（要件2.7, 4.1）
   */
  private async handleStopReel(reelIndex: number): Promise<void> {
    try {
      // 要件2.5: 対応するリールを停止
      const symbol = this.gameEngine.stopReel(reelIndex);

      // UIでアニメーションを停止
      this.userInterface.stopSpinAnimation(reelIndex);

      // 停止したリールのシンボルセットを表示
      const currentSymbolSets = this.gameEngine.getCurrentReelSymbolSets();
      this.userInterface.displayReelSymbolSets(currentSymbolSets);

      // 要件2.6: 停止ボタンの状態を更新（回転中のリールは有効、停止したリールは無効）
      const buttonStates = [
        this.gameEngine.isReelSpinning(0),
        this.gameEngine.isReelSpinning(1),
        this.gameEngine.isReelSpinning(2),
      ];
      this.userInterface.displayStopButtons(buttonStates);

      console.log(`🛑 リール ${reelIndex + 1} 停止: ${symbol.displayValue}`);

      // 要件2.7, 4.1: すべてのリールが停止したら勝敗判定
      if (this.gameEngine.areAllReelsStopped()) {
        // リールシンボル更新を停止
        this.stopReelSymbolUpdates();

        await this.delay(300);
        await this.handleGameResult();
      }
    } catch (error) {
      console.error(`❌ リール ${reelIndex + 1} の停止中にエラーが発生しました:`, error);

      // エラーメッセージを表示
      if (error instanceof Error) {
        this.userInterface.displayResult({
          isWin: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * ゲーム結果を処理します
   *
   * 結果処理フロー：
   * 1. 勝敗を評価
   * 2. 結果を表示（要件4.4, 4.5）
   * 3. 短い遅延後にスピンボタンを再有効化
   */
  private async handleGameResult(): Promise<void> {
    try {
      // 勝敗を評価
      const spinResult = this.gameEngine.evaluateResult();

      // 要件4.4, 4.5: 勝敗結果を表示
      this.userInterface.displayResult(spinResult.winResult);

      // ログ出力
      console.log('🎰 スピン結果:', {
        symbols: spinResult.symbols.map(s => s.displayValue).join(' '),
        isWin: spinResult.winResult.isWin,
        message: spinResult.winResult.message,
      });

      // 結果表示後、短い遅延
      await this.delay(2000);

      // スピンボタンを再有効化
      this.userInterface.displaySpinButton(true);

      // 停止ボタンを無効化
      this.userInterface.displayStopButtons([false, false, false]);
    } catch (error) {
      console.error('❌ 結果処理中にエラーが発生しました:', error);

      // エラー時もボタンを再有効化
      this.userInterface.displaySpinButton(true);
      this.userInterface.displayStopButtons([false, false, false]);
    }
  }

  /**
   * 指定されたミリ秒だけ待機するヘルパー関数
   * @param ms 待機時間（ミリ秒）
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * アプリケーションが初期化されているかチェック
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 現在のゲーム状態を取得
   */
  getCurrentState(): GameState {
    return this.gameEngine.getCurrentState();
  }

  /**
   * アプリケーションをクリーンアップ（主にテスト用）
   */
  cleanup(): void {
    this.userInterface.cleanup();
    this.isInitialized = false;
  }
}

/**
 * メインエントリポイント関数
 * DOMが読み込まれた後にアプリケーションを初期化します
 */
export function main(): void {
  // DOMの読み込みを待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // 既に読み込まれている場合は即座に初期化
    initializeApp();
  }
}

/**
 * アプリケーションの初期化処理
 */
function initializeApp(): void {
  try {
    console.log('🎰 スロットマシンアプリケーションを起動中...');

    // SlotMachineAppインスタンスを作成
    const app = new SlotMachineApp('slot-machine-container');

    // アプリケーションを初期化
    app.initialize();

    // グローバルスコープに公開（デバッグ用）
    (window as any).slotMachineApp = app;

    console.log('🎉 アプリケーションの起動が完了しました！');
  } catch (error) {
    console.error('❌ アプリケーションの初期化に失敗しました:', error);
  }
}

// ブラウザ環境の場合、自動的にmain関数を実行
// テスト環境では実行しない
if (typeof window !== 'undefined' && !process.env.JEST_WORKER_ID) {
  main();
}
