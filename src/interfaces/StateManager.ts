import { GameState } from '../types';

/**
 * Manages game state transitions and validation
 */
export interface StateManager {
  // State management
  getCurrentState(): GameState;
  transitionTo(newState: GameState): boolean;
  canTransition(from: GameState, to: GameState): boolean;

  // State validation
  isValidState(state: GameState): boolean;
}
