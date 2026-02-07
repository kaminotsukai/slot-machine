import { ReelManager as IReelManager } from './interfaces/ReelManager';
import { Symbol, DEFAULT_SYMBOLS } from './types';

/**
 * ReelManager implementation that handles the three reels and their symbol generation
 * Ensures independent random generation for exactly 3 reels with consistent symbol sets
 */
export class ReelManager implements IReelManager {
  private readonly REEL_COUNT = 3;
  private readonly symbolSet: Symbol[];

  constructor(customSymbols?: Symbol[]) {
    this.symbolSet = customSymbols || DEFAULT_SYMBOLS;
    
    if (!this.validateSymbolSet(this.symbolSet)) {
      throw new Error('Invalid symbol set provided');
    }
  }

  /**
   * Spins all reels and returns an array of symbols (one per reel)
   * Each reel generates its symbol independently
   */
  async spinReels(): Promise<Symbol[]> {
    const results: Symbol[] = [];
    
    // Generate independent random symbols for each reel
    for (let i = 0; i < this.REEL_COUNT; i++) {
      results.push(this.generateRandomSymbol());
    }
    
    return results;
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