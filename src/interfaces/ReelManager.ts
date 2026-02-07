import { Symbol } from '../types';

/**
 * Manages the three reels and their symbol generation
 */
export interface ReelManager {
  // Reel operations
  spinReels(): Promise<Symbol[]>;
  getReelCount(): number;
  
  // Symbol management
  generateRandomSymbol(): Symbol;
  validateSymbolSet(symbols: Symbol[]): boolean;
}