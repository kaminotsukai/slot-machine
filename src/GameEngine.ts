import { GameEngine as IGameEngine } from './interfaces/GameEngine';
import { StateManager } from './StateManager';
import { ReelManager } from './ReelManager';
import { WinEvaluator } from './WinEvaluator';
import { GameState, SpinResult, Symbol, WinCondition } from './types';

/**
 * GameEngineクラス
 * ゲームフローを統括し、スロットマシンの全体的な機能を管理する
 *
 * 要件2.1, 2.5, 2.7, 4.1に対応：
 * - スピン操作の開始と個別停止を管理
 * - StateManager、ReelManager、WinEvaluatorを統合
 * - 開始から個別停止、結果までの完全なゲームサイクルを処理
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
   * スピンを開始する
   *
   * スピン開始処理：
   * 1. IDLE → SPINNING状態に遷移
   * 2. リールを回転させる
   *
   * @throws スピンが不可能な状態の場合にエラーをスロー
   *
   * 要件: 2.1 - スピンボタンクリック時に3つのリールすべてを同時に回転
   */
  initiateSpin(): void {
    // スピンが可能かチェック
    if (!this.canSpin()) {
      throw new Error(`スピンを開始できません。現在の状態: ${this.getCurrentState()}`);
    }

    // IDLE → SPINNING状態に遷移
    const transitioned = this.stateManager.transitionTo(GameState.SPINNING);
    if (!transitioned) {
      throw new Error('SPINNING状態への遷移に失敗しました');
    }

    // リールを回転させる
    this.reelManager.spinReels();
  }

  /**
   * 指定されたリールを停止する
   *
   * @param reelIndex - 停止するリールのインデックス（0-2）
   * @returns 停止したリールのシンボル
   * @throws リールが回転していない場合、または無効なインデックスの場合にエラーをスロー
   *
   * 要件: 2.5 - 停止ボタンクリック時に対応するリールを停止
   * 要件: 3.3 - 対応するリールのみを停止
   */
  stopReel(reelIndex: number): Symbol {
    const currentState = this.getCurrentState();

    // 回転中または部分停止中でない場合はエラー
    if (currentState !== GameState.SPINNING && currentState !== GameState.PARTIALLY_STOPPED) {
      throw new Error(`リールを停止できません。現在の状態: ${currentState}`);
    }

    // リールが回転中かチェック
    if (!this.reelManager.isReelSpinning(reelIndex)) {
      throw new Error(`リール ${reelIndex + 1} は既に停止しています`);
    }

    // リールを停止してシンボルを取得
    const symbol = this.reelManager.stopReel(reelIndex);

    // 状態を更新
    const allStopped =
      !this.reelManager.isReelSpinning(0) &&
      !this.reelManager.isReelSpinning(1) &&
      !this.reelManager.isReelSpinning(2);

    if (allStopped) {
      // すべてのリールが停止した場合、SHOWING_RESULTS状態に遷移
      this.stateManager.transitionTo(GameState.SHOWING_RESULTS);
    } else if (currentState === GameState.SPINNING) {
      // 最初のリールが停止した場合、PARTIALLY_STOPPED状態に遷移
      this.stateManager.transitionTo(GameState.PARTIALLY_STOPPED);
    }

    return symbol;
  }

  /**
   * すべてのリールが停止しているかチェック
   * @returns すべてのリールが停止している場合はtrue
   */
  areAllReelsStopped(): boolean {
    return (
      !this.reelManager.isReelSpinning(0) &&
      !this.reelManager.isReelSpinning(1) &&
      !this.reelManager.isReelSpinning(2)
    );
  }

  /**
   * 指定されたリールが回転中かチェック
   * @param reelIndex - チェックするリールのインデックス
   * @returns リールが回転中の場合はtrue
   */
  isReelSpinning(reelIndex: number): boolean {
    return this.reelManager.isReelSpinning(reelIndex);
  }

  /**
   * 現在のリールのシンボルを取得
   * @returns シンボルの配列（回転中のリールはnull）
   */
  getCurrentReelSymbols(): (Symbol | null)[] {
    return this.reelManager.getAllReelSymbols();
  }

  /**
   * 勝敗を評価する
   * すべてのリールが停止している必要がある
   *
   * @returns 勝敗評価結果
   * @throws すべてのリールが停止していない場合にエラーをスロー
   *
   * 要件: 4.1 - すべてのリールが停止した時にシンボルの組み合わせを評価
   */
  evaluateResult(): SpinResult {
    if (!this.areAllReelsStopped()) {
      throw new Error('すべてのリールが停止していません');
    }

    const symbols = this.reelManager.getAllReelSymbols();

    // nullチェック
    if (symbols.some(s => s === null)) {
      throw new Error('一部のリールがまだ停止していません');
    }

    // 勝敗を評価
    const winResult = this.winEvaluator.evaluateResult(symbols as Symbol[]);

    // SHOWING_RESULTS → IDLE状態に遷移
    this.stateManager.transitionTo(GameState.IDLE);

    return {
      symbols: symbols as Symbol[],
      winResult,
      timestamp: new Date(),
    };
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
