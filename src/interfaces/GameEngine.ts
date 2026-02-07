import { GameState, SpinResult, Symbol, WinCondition } from '../types';

/**
 * The core game engine manages the overall slot machine functionality
 */
export interface GameEngine {
  // Game state management
  getCurrentState(): GameState;
  canSpin(): boolean;
  
  // Spin operations
  initiateSpin(): Promise<SpinResult>;
  
  // Configuration
  getSymbols(): Symbol[];
  getWinConditions(): WinCondition[];
}