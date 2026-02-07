/**
 * Core types and interfaces for the slot machine application
 */

// Game state enumeration
export enum GameState {
  IDLE = 'idle',
  SPINNING = 'spinning',
  PARTIALLY_STOPPED = 'partially_stopped',
  SHOWING_RESULTS = 'showing_results'
}

// Symbol representation
export interface Symbol {
  id: string;
  name: string;
  displayValue: string;
  rarity?: number;
}

// Spin result data
export interface SpinResult {
  symbols: Symbol[];
  winResult: WinResult;
  timestamp: Date;
}

// Win evaluation result
export interface WinResult {
  isWin: boolean;
  winType?: string;
  message: string;
}

// Win condition definition
export interface WinCondition {
  id: string;
  name: string;
  pattern: (symbols: Symbol[]) => boolean;
  message: string;
}

// Default symbol set
export const DEFAULT_SYMBOLS: Symbol[] = [
  { id: 'cherry', name: 'Cherry', displayValue: '🍒' },
  { id: 'lemon', name: 'Lemon', displayValue: '🍋' },
  { id: 'orange', name: 'Orange', displayValue: '🍊' },
  { id: 'plum', name: 'Plum', displayValue: '🍇' },
  { id: 'bell', name: 'Bell', displayValue: '🔔' },
  { id: 'bar', name: 'Bar', displayValue: '⬛' },
  { id: 'seven', name: 'Seven', displayValue: '7️⃣' }
];