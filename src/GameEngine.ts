import { GameEngine as IGameEngine } from './interfaces/GameEngine';
import { StateManager } from './StateManager';
import { ReelManager } from './ReelManager';
import { WinEvaluator } from './WinEvaluator';
import { GameState, SpinResult, Symbol, WinCondition } from './types';

/**
 * GameEngineクラス
 * ゲームフローを統括し、スロットマシンの全体的な機能を管理する
 * 
 * 要件2.1, 2.4, 4.1に対応：
 * - スピン操作の開始と完了を管理
 * - StateManager、ReelManager、WinEvaluatorを統合
 * - 開始から結果までの完全なスピンサイクルを処理
 */
export class GameEngine implements IGameEngine {
  private stateManager: StateManager;
  private reelManager: ReelManager;
  private winEvaluator: WinEvaluator;

  /**
   * GameEngineのコンストラクタ
   * @param customSymbols オプション：カスタムシンボルセット
   */
  constructor(customSymbols?: Symbol[]) {
    this.stateManager = new StateManager();
    this.reelManager = new ReelManager(customSymbols);
    this.winEvaluator = new WinEvaluator();
  }

  /**
   * 現在のゲーム状態を取得
   * @returns 現在のGameState
   */
  getCurrentState(): GameState {
    return this.stateManager.getCurrentState();
  }

  /**
   * スピンが可能かどうかをチェック
   * スピンはIDLE状態の時のみ可能
   * @returns スピン可能な場合はtrue
   */
  canSpin(): boolean {
    return this.stateManager.getCurrentState() === GameState.IDLE;
  }

  /**
   * スピンを開始し、完全なスピンサイクルを実行
   * 
   * スピンサイクル：
   * 1. IDLE → SPINNING状態に遷移
   * 2. リールを回転させてシンボルを生成
   * 3. SPINNING → SHOWING_RESULTS状態に遷移
   * 4. 勝敗を評価
   * 5. SHOWING_RESULTS → IDLE状態に遷移
   * 
   * @returns スピン結果（シンボル、勝敗評価、タイムスタンプ）
   * @throws スピンが不可能な状態の場合にエラーをスロー
   */
  async initiateSpin(): Promise<SpinResult> {
    // スピンが可能かチェック
    if (!this.canSpin()) {
      throw new Error(
        `スピンを開始できません。現在の状態: ${this.getCurrentState()}`
      );
    }

    // 1. IDLE → SPINNING状態に遷移
    const transitionedToSpinning = this.stateManager.transitionTo(GameState.SPINNING);
    if (!transitionedToSpinning) {
      throw new Error('SPINNING状態への遷移に失敗しました');
    }

    try {
      // 2. リールを回転させてシンボルを生成
      const symbols = await this.reelManager.spinReels();

      // 3. SPINNING → SHOWING_RESULTS状態に遷移
      const transitionedToResults = this.stateManager.transitionTo(
        GameState.SHOWING_RESULTS
      );
      if (!transitionedToResults) {
        throw new Error('SHOWING_RESULTS状態への遷移に失敗しました');
      }

      // 4. 勝敗を評価
      const winResult = this.winEvaluator.evaluateResult(symbols);

      // 5. SHOWING_RESULTS → IDLE状態に遷移
      const transitionedToIdle = this.stateManager.transitionTo(GameState.IDLE);
      if (!transitionedToIdle) {
        throw new Error('IDLE状態への遷移に失敗しました');
      }

      // スピン結果を返す
      return {
        symbols,
        winResult,
        timestamp: new Date()
      };
    } catch (error) {
      // エラーが発生した場合、状態をIDLEに戻す
      this.stateManager.transitionTo(GameState.SHOWING_RESULTS);
      this.stateManager.transitionTo(GameState.IDLE);
      throw error;
    }
  }

  /**
   * 使用可能なシンボルセットを取得
   * @returns シンボルの配列
   */
  getSymbols(): Symbol[] {
    return this.reelManager.getSymbolSet();
  }

  /**
   * 現在設定されている勝利条件を取得
   * @returns 勝利条件の配列
   */
  getWinConditions(): WinCondition[] {
    return this.winEvaluator.getWinConditions();
  }
}
