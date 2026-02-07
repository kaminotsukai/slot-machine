import { Symbol, WinResult } from '../types';

/**
 * すべての視覚要素とユーザーインタラクションを処理
 */
export interface UserInterface {
  // 表示操作
  displayReels(symbols: Symbol[]): void;
  displaySpinButton(enabled: boolean): void;
  displayResult(result: WinResult): void;
  
  // アニメーション
  startSpinAnimation(options?: {
    duration?: number;
    onComplete?: () => void;
    staggeredStop?: boolean;
  }): Promise<void>;
  stopSpinAnimation(): void;
  
  // アニメーション設定
  setAnimationDuration(duration: number): void;
  getAnimationDuration(): number;
  isSpinning(): boolean;
  
  // イベントハンドリング
  onSpinButtonClick(callback: () => void): void;
}