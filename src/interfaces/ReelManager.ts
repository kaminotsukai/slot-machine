import { Symbol } from '../types';

/**
 * Manages the three reels and their symbol generation
 */
export interface ReelManager {
  // Reel operations
  spinReels(): void;
  stopReel(reelIndex: number): Symbol;
  isReelSpinning(reelIndex: number): boolean;
  getReelCount(): number;
  getAllReelSymbols(): (Symbol | null)[];
  
  // Symbol management
  generateRandomSymbol(): Symbol;
  validateSymbolSet(symbols: Symbol[]): boolean;
}