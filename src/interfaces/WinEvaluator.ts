import { Symbol, WinResult, WinCondition } from '../types';

/**
 * Evaluates spin results to determine wins and losses
 */
export interface WinEvaluator {
  // Win evaluation
  evaluateResult(symbols: Symbol[]): WinResult;
  isWinningCombination(symbols: Symbol[]): boolean;
  
  // Win condition management
  addWinCondition(condition: WinCondition): void;
  getWinConditions(): WinCondition[];
}