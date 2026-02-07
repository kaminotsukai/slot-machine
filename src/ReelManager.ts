import { ReelManager as IReelManager } from './interfaces/ReelManager';
import { Symbol, DEFAULT_SYMBOLS } from './types';

/**
 * ReelManager implementation that handles the three reels and their symbol generation
 * Ensures independent random generation for exactly 3 reels with consistent symbol sets
 * Supports individual reel stopping for manual control
 */
export class ReelManager implements IReelManager {
  private readonly REEL_COUNT = 3;
  private readonly symbolSet: Symbol[];
  private reelStates: ('spinning' | 'stopped')[];
  private reelSymbols: (Symbol | null)[];

  constructor(customSymbols?: Symbol[]) {
    this.symbolSet = customSymbols || DEFAULT_SYMBOLS;
    
    if (!this.validateSymbolSet(this.symbolSet)) {
      throw new Error('Invalid symbol set provided');
    }

    // 各リールの状態を初期化
    this.reelStates = ['stopped', 'stopped', 'stopped'];
    this.reelSymbols = [null, null, null];
  }

  /**
   * Spins all reels - sets them to spinning state
   * Does not generate symbols until stopReel is called
   * 
   * 要件: 2.1 - スピンボタンクリック時に3つのリールすべてを同時に回転
   */
  spinReels(): void {
    // すべてのリールを回転状態に設定
    for (let i = 0; i < this.REEL_COUNT; i++) {
      this.reelStates[i] = 'spinning';
      this.reelSymbols[i] = null;
    }
  }

  /**
   * Stops a specific reel and generates its symbol
   * 
   * @param reelIndex - Index of the reel to stop (0-2)
   * @returns The symbol that was generated for this reel
   * @throws Error if reel index is invalid or reel is already stopped
   * 
   * 要件: 2.5 - 停止ボタンクリック時に対応するリールを停止
   * 要件: 3.2 - 各リールに対して独立してランダムなシンボルを生成
   * 要件: 3.3 - 対応するリールのみを停止
   */
  stopReel(reelIndex: number): Symbol {
    // インデックスの検証
    if (reelIndex < 0 || reelIndex >= this.REEL_COUNT) {
      throw new Error(`Invalid reel index: ${reelIndex}. Must be between 0 and ${this.REEL_COUNT - 1}`);
    }

    // リールが回転中かチェック
    if (this.reelStates[reelIndex] === 'stopped') {
      throw new Error(`Reel ${reelIndex} is already stopped`);
    }

    // ランダムシンボルを生成
    const symbol = this.generateRandomSymbol();
    
    // リールを停止状態に設定
    this.reelStates[reelIndex] = 'stopped';
    this.reelSymbols[reelIndex] = symbol;

    return symbol;
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
   * Gets all reel symbols (null for spinning reels)
   * 
   * @returns Array of symbols (null for reels that are still spinning)
   * 
   * 要件: 3.4 - 各リールに正確に1つのシンボルを表示
   * 要件: 3.5 - 停止したリールの状態を維持
   */
  getAllReelSymbols(): (Symbol | null)[] {
    return [...this.reelSymbols];
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
    return symbols.every(symbol => 
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