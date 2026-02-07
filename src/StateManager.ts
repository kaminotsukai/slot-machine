import { StateManager as IStateManager } from './interfaces/StateManager';
import { GameState } from './types';

/**
 * StateManager implementation that handles game state transitions and validation
 * Manages the flow: idle → spinning → showing_results → idle
 */
export class StateManager implements IStateManager {
  private currentState: GameState;

  constructor(initialState: GameState = GameState.IDLE) {
    this.currentState = initialState;
  }

  /**
   * Gets the current game state
   */
  getCurrentState(): GameState {
    return this.currentState;
  }

  /**
   * Attempts to transition to a new state
   * Returns true if transition was successful, false otherwise
   */
  transitionTo(newState: GameState): boolean {
    if (!this.canTransition(this.currentState, newState)) {
      return false;
    }

    this.currentState = newState;
    return true;
  }

  /**
   * Checks if a transition from one state to another is valid
   * Valid transitions:
   * - idle → spinning
   * - spinning → partially_stopped (when first reel stops)
   * - spinning → showing_results (when all reels stop at once)
   * - partially_stopped → partially_stopped (when more reels stop)
   * - partially_stopped → showing_results (when last reel stops)
   * - showing_results → idle
   */
  canTransition(from: GameState, to: GameState): boolean {
    // Self-transitions are allowed for partially_stopped state
    if (from === to && from === GameState.PARTIALLY_STOPPED) {
      return true;
    }

    // Other self-transitions are not allowed
    if (from === to) {
      return false;
    }

    // Define valid state transitions
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.IDLE]: [GameState.SPINNING],
      [GameState.SPINNING]: [GameState.PARTIALLY_STOPPED, GameState.SHOWING_RESULTS],
      [GameState.PARTIALLY_STOPPED]: [GameState.PARTIALLY_STOPPED, GameState.SHOWING_RESULTS],
      [GameState.SHOWING_RESULTS]: [GameState.IDLE],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Validates if a given state is a valid GameState
   */
  isValidState(state: GameState): boolean {
    return Object.values(GameState).includes(state);
  }
}
