import { Symbol, WinResult } from '../types';

/**
 * すべての視覚要素とユーザーインタラクションを処理
 */
export interface UserInterface {
  // 表示操作
  displayReels(symbols: (Symbol | null)[]): void;
  displaySpinButton(enabled: boolean): void;
  displayStopButtons(enabledStates: boolean[]): void;
  displayResult(result: WinResult): void;

  // アニメーション
  startSpinAnimation(reelIndex?: number): void;
  stopSpinAnimation(reelIndex: number): void;

  // イベントハンドリング
  onSpinButtonClick(callback: () => void): void;
  onStopButtonClick(callback: (reelIndex: number) => void): void;
}
