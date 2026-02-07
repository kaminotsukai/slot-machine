import { ReelManager as IReelManager } from './interfaces/ReelManager';
import { Symbol, DEFAULT_SYMBOLS } from './types';

/**
 * ReelManager implementation that handles the three reels and their symbol generation
 * Ensures independent random generation for exactly 3 reels with consistent symbol sets
 * Supports individual reel stopping for manual control with sequential stopping order
 */
export class ReelManager implements IReelManager {
  private readonly REEL_COUNT = 3;
  private readonly SYMBOLS_PER_REEL = 3; // 各リールに表示するシンボル数
  private readonly symbolSet: Symbol[];
  private reelStates: ('spinning' | 'stopped')[];
  private reelSymbols: (Symbol | null)[]; // 中央のシンボル（ペイライン上）
  private reelSymbolSets: (Symbol[] | null)[]; // 各リールの3シンボル [上, 中央, 下]
  private reelPositions: number[]; // 各リールの現在位置（0-6）
  private animationIntervals: (number | null)[]; // 各リールのアニメーション用インターバル

  constructor(customSymbols?: Symbol[]) {
    this.symbolSet = customSymbols || DEFAULT_SYMBOLS;

    if (!this.validateSymbolSet(this.symbolSet)) {
      throw new Error('Invalid symbol set provided');
    }

    // 各リールの状態を初期化
    this.reelStates = ['stopped', 'stopped', 'stopped'];
    this.reelSymbols = [null, null, null];
    this.reelSymbolSets = [null, null, null];
    this.reelPositions = [0, 0, 0];
    this.animationIntervals = [null, null, null];
  }

  /**
   * Spins all reels - sets them to spinning state and starts animation
   * Does not generate final symbols until stopReel is called
   *
   * 要件: 2.1 - スピンボタンクリック時に3つのリールすべてを同時に回転
   */
  spinReels(): void {
    // すべてのリールを回転状態に設定
    for (let i = 0; i < this.REEL_COUNT; i++) {
      this.reelStates[i] = 'spinning';
      this.reelSymbols[i] = null;
      this.reelSymbolSets[i] = null;
      this.reelPositions[i] = 0;

      // リールアニメーションを開始（シンボルを順番に表示）
      this.startReelAnimation(i);
    }
  }

  /**
   * リールアニメーションを開始（目押し用）
   * シンボルを順番に表示し続ける
   */
  private startReelAnimation(reelIndex: number): void {
    // 既存のアニメーションをクリア
    const existingInterval = this.animationIntervals[reelIndex];
    if (existingInterval !== null && existingInterval !== undefined) {
      clearInterval(existingInterval);
    }

    // 100msごとにシンボルを変更
    this.animationIntervals[reelIndex] = window.setInterval(() => {
      const currentPos = this.reelPositions[reelIndex];
      if (currentPos !== undefined) {
        this.reelPositions[reelIndex] = (currentPos + 1) % this.symbolSet.length;
      }
    }, 100);
  }

  /**
   * リールアニメーションを停止
   */
  private stopReelAnimation(reelIndex: number): void {
    const interval = this.animationIntervals[reelIndex];
    if (interval !== null && interval !== undefined) {
      clearInterval(interval);
      this.animationIntervals[reelIndex] = null;
    }
  }

  /**
   * 現在のリール位置のシンボルを取得（目押し用）
   */
  getCurrentSymbolAtPosition(reelIndex: number): Symbol {
    const position = this.reelPositions[reelIndex];
    if (position === undefined) {
      throw new Error(`Invalid reel index: ${reelIndex}`);
    }
    const symbol = this.symbolSet[position];
    if (!symbol) {
      throw new Error(`No symbol found at position ${position}`);
    }
    return symbol;
  }

  /**
   * 現在のリール位置の3シンボルセットを取得（上・中央・下）
   */
  getCurrentSymbolSetAtPosition(reelIndex: number): Symbol[] {
    const position = this.reelPositions[reelIndex];
    if (position === undefined) {
      throw new Error(`Invalid reel index: ${reelIndex}`);
    }

    const symbolSetLength = this.symbolSet.length;
    const symbols: Symbol[] = [];

    // 上のシンボル（現在位置の1つ前）
    const topIndex = (position - 1 + symbolSetLength) % symbolSetLength;
    const topSymbol = this.symbolSet[topIndex];
    if (!topSymbol) throw new Error(`No symbol found at position ${topIndex}`);
    symbols.push(topSymbol);

    // 中央のシンボル（現在位置）
    const centerSymbol = this.symbolSet[position];
    if (!centerSymbol) throw new Error(`No symbol found at position ${position}`);
    symbols.push(centerSymbol);

    // 下のシンボル（現在位置の1つ後）
    const bottomIndex = (position + 1) % symbolSetLength;
    const bottomSymbol = this.symbolSet[bottomIndex];
    if (!bottomSymbol) throw new Error(`No symbol found at position ${bottomIndex}`);
    symbols.push(bottomSymbol);

    return symbols;
  }

  /**
   * Stops a specific reel at its current position (for timing-based stopping)
   *
   * @param reelIndex - Index of the reel to stop (0-2)
   * @returns The symbol that was at the current position when stopped
   * @throws Error if reel index is invalid or reel is already stopped
   *
   * 要件: 2.5 - 停止ボタンクリック時に対応するリールを停止
   * 要件: 3.2 - 各リールに対して独立してランダムなシンボルを生成
   * 要件: 3.3 - 対応するリールのみを停止
   */
  stopReel(reelIndex: number): Symbol {
    // インデックスの検証
    if (reelIndex < 0 || reelIndex >= this.REEL_COUNT) {
      throw new Error(
        `Invalid reel index: ${reelIndex}. Must be between 0 and ${this.REEL_COUNT - 1}`
      );
    }

    // リールが回転中かチェック
    if (this.reelStates[reelIndex] === 'stopped') {
      throw new Error(`Reel ${reelIndex} is already stopped`);
    }

    // アニメーションを停止
    this.stopReelAnimation(reelIndex);

    // 現在位置の3シンボルセットを取得（目押し）
    const symbolSet = this.getCurrentSymbolSetAtPosition(reelIndex);
    const centerSymbol = symbolSet[1]; // 中央のシンボル（ペイライン上）

    if (!centerSymbol) {
      throw new Error('Failed to get center symbol');
    }

    // リールを停止状態に設定
    this.reelStates[reelIndex] = 'stopped';
    this.reelSymbols[reelIndex] = centerSymbol;
    this.reelSymbolSets[reelIndex] = symbolSet;

    return centerSymbol;
  }

  /**
   * Checks if a specific reel is currently spinning
   *
   * @param reelIndex - Index of the reel to check (0-2)
   * @returns true if the reel is spinning, false if stopped
   *
   * 要件: 3.5 - 他のリールが回転中、停止したリールの状態を維持
   */
  isReelSpinning(reelIndex: number): boolean {
    if (reelIndex < 0 || reelIndex >= this.REEL_COUNT) {
      return false;
    }
    return this.reelStates[reelIndex] === 'spinning';
  }

  /**
   * Gets all reel symbols (current position for spinning reels, final symbol for stopped reels)
   *
   * @returns Array of symbols (current symbol for spinning reels, final symbol for stopped reels)
   *
   * 要件: 3.4 - 各リールに正確に1つのシンボルを表示
   * 要件: 3.5 - 停止したリールの状態を維持
   */
  getAllReelSymbols(): (Symbol | null)[] {
    const result: (Symbol | null)[] = [];

    for (let i = 0; i < this.REEL_COUNT; i++) {
      if (this.reelStates[i] === 'stopped') {
        // 停止したリールは確定したシンボルを返す
        result.push(this.reelSymbols[i] || null);
      } else {
        // 回転中のリールは現在位置のシンボルを返す（目押し用）
        try {
          result.push(this.getCurrentSymbolAtPosition(i));
        } catch {
          result.push(null);
        }
      }
    }

    return result;
  }

  /**
   * 各リールの3シンボルセット（上・中央・下）を取得
   * UIで3つのシンボルを表示するために使用
   *
   * @returns 各リールの3シンボル配列の配列
   */
  getAllReelSymbolSets(): (Symbol[] | null)[] {
    const result: (Symbol[] | null)[] = [];

    for (let i = 0; i < this.REEL_COUNT; i++) {
      if (this.reelStates[i] === 'stopped') {
        // 停止したリールは確定した3シンボルセットを返す
        result.push(this.reelSymbolSets[i] || null);
      } else {
        // 回転中のリールは現在位置の3シンボルセットを返す
        try {
          result.push(this.getCurrentSymbolSetAtPosition(i));
        } catch {
          result.push(null);
        }
      }
    }

    return result;
  }

  /**
   * Returns the number of reels (always 3)
   */
  getReelCount(): number {
    return this.REEL_COUNT;
  }

  /**
   * Generates a random symbol from the symbol set
   * Each symbol has equal probability of being selected
   */
  generateRandomSymbol(): Symbol {
    if (this.symbolSet.length === 0) {
      throw new Error('No symbols available for generation');
    }

    const randomIndex = Math.floor(Math.random() * this.symbolSet.length);
    const symbol = this.symbolSet[randomIndex];

    if (!symbol) {
      throw new Error('Failed to generate symbol');
    }

    return symbol;
  }

  /**
   * Validates that a symbol set is valid for use
   * Checks for non-empty array and valid symbol structure
   */
  validateSymbolSet(symbols: Symbol[]): boolean {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return false;
    }

    // Check each symbol has required properties
    return symbols.every(
      symbol =>
        symbol &&
        typeof symbol.id === 'string' &&
        typeof symbol.name === 'string' &&
        typeof symbol.displayValue === 'string' &&
        symbol.id.length > 0 &&
        symbol.name.length > 0 &&
        symbol.displayValue.length > 0
    );
  }

  /**
   * Gets the current symbol set being used
   */
  getSymbolSet(): Symbol[] {
    return [...this.symbolSet]; // Return a copy to prevent external modification
  }
}
