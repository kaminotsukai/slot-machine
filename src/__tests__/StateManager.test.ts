/**
 * Unit tests for StateManager component
 * Tests state transition logic and validation
 */

import { StateManager } from '../StateManager';
import { GameState } from '../types';
import * as fc from 'fast-check';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Initialization', () => {
    test('should initialize with IDLE state by default', () => {
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
    });

    test('should initialize with provided state', () => {
      const customStateManager = new StateManager(GameState.SPINNING);
      expect(customStateManager.getCurrentState()).toBe(GameState.SPINNING);
    });
  });

  describe('State Management', () => {
    test('getCurrentState should return current state', () => {
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
    });

    test('transitionTo should change state when valid transition', () => {
      const result = stateManager.transitionTo(GameState.SPINNING);
      expect(result).toBe(true);
      expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
    });

    test('transitionTo should reject invalid transitions', () => {
      const result = stateManager.transitionTo(GameState.SHOWING_RESULTS);
      expect(result).toBe(false);
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
    });

    test('transitionTo should reject self-transitions', () => {
      const result = stateManager.transitionTo(GameState.IDLE);
      expect(result).toBe(false);
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
    });
  });

  describe('Valid State Transitions', () => {
    test('should allow IDLE → SPINNING transition', () => {
      expect(stateManager.canTransition(GameState.IDLE, GameState.SPINNING)).toBe(true);
    });

    test('should allow SPINNING → SHOWING_RESULTS transition', () => {
      expect(stateManager.canTransition(GameState.SPINNING, GameState.SHOWING_RESULTS)).toBe(true);
    });

    test('should allow SHOWING_RESULTS → IDLE transition', () => {
      expect(stateManager.canTransition(GameState.SHOWING_RESULTS, GameState.IDLE)).toBe(true);
    });
  });

  describe('Invalid State Transitions', () => {
    test('should reject IDLE → SHOWING_RESULTS transition', () => {
      expect(stateManager.canTransition(GameState.IDLE, GameState.SHOWING_RESULTS)).toBe(false);
    });

    test('should reject SPINNING → IDLE transition', () => {
      expect(stateManager.canTransition(GameState.SPINNING, GameState.IDLE)).toBe(false);
    });

    test('should reject SHOWING_RESULTS → SPINNING transition', () => {
      expect(stateManager.canTransition(GameState.SHOWING_RESULTS, GameState.SPINNING)).toBe(false);
    });

    test('should reject all self-transitions', () => {
      expect(stateManager.canTransition(GameState.IDLE, GameState.IDLE)).toBe(false);
      expect(stateManager.canTransition(GameState.SPINNING, GameState.SPINNING)).toBe(false);
      expect(stateManager.canTransition(GameState.SHOWING_RESULTS, GameState.SHOWING_RESULTS)).toBe(false);
    });
  });

  describe('Complete State Flow', () => {
    test('should complete full state cycle: IDLE → SPINNING → SHOWING_RESULTS → IDLE', () => {
      // Start in IDLE
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);

      // Transition to SPINNING
      expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
      expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);

      // Transition to SHOWING_RESULTS
      expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
      expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);

      // Transition back to IDLE
      expect(stateManager.transitionTo(GameState.IDLE)).toBe(true);
      expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
    });
  });

  describe('State Validation', () => {
    test('isValidState should return true for valid GameState values', () => {
      expect(stateManager.isValidState(GameState.IDLE)).toBe(true);
      expect(stateManager.isValidState(GameState.SPINNING)).toBe(true);
      expect(stateManager.isValidState(GameState.SHOWING_RESULTS)).toBe(true);
    });

    test('isValidState should return false for invalid values', () => {
      // TypeScript prevents this at compile time, but testing runtime behavior
      expect(stateManager.isValidState('invalid' as GameState)).toBe(false);
      expect(stateManager.isValidState('' as GameState)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple consecutive valid transitions', () => {
      expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
      expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
      expect(stateManager.transitionTo(GameState.IDLE)).toBe(true);
      expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
      expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
    });

    test('should maintain state consistency after failed transitions', () => {
      const initialState = stateManager.getCurrentState();
      stateManager.transitionTo(GameState.SHOWING_RESULTS); // Invalid transition
      expect(stateManager.getCurrentState()).toBe(initialState);
    });

    describe('Invalid State Transitions - Comprehensive', () => {
      test('should reject all invalid transitions from IDLE state', () => {
        // IDLE → IDLE (self-transition)
        expect(stateManager.transitionTo(GameState.IDLE)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.IDLE);

        // IDLE → SHOWING_RESULTS (skipping SPINNING)
        expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
      });

      test('should reject all invalid transitions from SPINNING state', () => {
        stateManager.transitionTo(GameState.SPINNING);
        
        // SPINNING → SPINNING (self-transition)
        expect(stateManager.transitionTo(GameState.SPINNING)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);

        // SPINNING → IDLE (backward transition)
        expect(stateManager.transitionTo(GameState.IDLE)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
      });

      test('should reject all invalid transitions from SHOWING_RESULTS state', () => {
        stateManager.transitionTo(GameState.SPINNING);
        stateManager.transitionTo(GameState.SHOWING_RESULTS);
        
        // SHOWING_RESULTS → SHOWING_RESULTS (self-transition)
        expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);

        // SHOWING_RESULTS → SPINNING (backward transition)
        expect(stateManager.transitionTo(GameState.SPINNING)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
      });

      test('should handle multiple consecutive invalid transition attempts', () => {
        const initialState = stateManager.getCurrentState();
        
        // 複数回の無効な遷移を試行
        for (let i = 0; i < 5; i++) {
          expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(false);
          expect(stateManager.getCurrentState()).toBe(initialState);
        }
      });

      test('should maintain state after alternating valid and invalid transitions', () => {
        // 有効な遷移
        expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);

        // 無効な遷移
        expect(stateManager.transitionTo(GameState.IDLE)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);

        // 有効な遷移
        expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
        expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);

        // 無効な遷移
        expect(stateManager.transitionTo(GameState.SPINNING)).toBe(false);
        expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
      });
    });

    describe('Boundary Conditions', () => {
      test('should handle invalid state values in isValidState', () => {
        // 空文字列
        expect(stateManager.isValidState('' as GameState)).toBe(false);
        
        // 無効な文字列
        expect(stateManager.isValidState('invalid_state' as GameState)).toBe(false);
        expect(stateManager.isValidState('INVALID' as GameState)).toBe(false);
        
        // 数値（型の不一致）
        expect(stateManager.isValidState(123 as any)).toBe(false);
        
        // null/undefined
        expect(stateManager.isValidState(null as any)).toBe(false);
        expect(stateManager.isValidState(undefined as any)).toBe(false);
        
        // オブジェクト
        expect(stateManager.isValidState({} as any)).toBe(false);
        expect(stateManager.isValidState({ state: 'idle' } as any)).toBe(false);
      });

      test('should handle canTransition with invalid state values', () => {
        // 無効な開始状態
        expect(stateManager.canTransition('invalid' as GameState, GameState.SPINNING)).toBe(false);
        
        // 無効な目標状態
        expect(stateManager.canTransition(GameState.IDLE, 'invalid' as GameState)).toBe(false);
        
        // 両方とも無効
        expect(stateManager.canTransition('invalid1' as GameState, 'invalid2' as GameState)).toBe(false);
      });

      test('should handle transitionTo with current state verification', () => {
        // 現在の状態を確認
        const currentState = stateManager.getCurrentState();
        expect(currentState).toBe(GameState.IDLE);
        
        // 無効な遷移を試行
        const result = stateManager.transitionTo(GameState.SHOWING_RESULTS);
        expect(result).toBe(false);
        
        // 状態が変更されていないことを確認
        expect(stateManager.getCurrentState()).toBe(currentState);
      });

      test('should maintain state consistency across many operations', () => {
        const operations = [
          { target: GameState.SPINNING, shouldSucceed: true },
          { target: GameState.IDLE, shouldSucceed: false },
          { target: GameState.SPINNING, shouldSucceed: false },
          { target: GameState.SHOWING_RESULTS, shouldSucceed: true },
          { target: GameState.SPINNING, shouldSucceed: false },
          { target: GameState.SHOWING_RESULTS, shouldSucceed: false },
          { target: GameState.IDLE, shouldSucceed: true },
          { target: GameState.IDLE, shouldSucceed: false },
        ];

        let expectedState = GameState.IDLE;

        for (const op of operations) {
          const result = stateManager.transitionTo(op.target);
          expect(result).toBe(op.shouldSucceed);
          
          if (op.shouldSucceed) {
            expectedState = op.target;
          }
          
          expect(stateManager.getCurrentState()).toBe(expectedState);
        }
      });

      test('should handle rapid state transitions correctly', () => {
        // 高速で連続した遷移を実行
        for (let i = 0; i < 10; i++) {
          expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
          expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
          
          expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
          expect(stateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
          
          expect(stateManager.transitionTo(GameState.IDLE)).toBe(true);
          expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
        }
      });

      test('should verify state after initialization with different starting states', () => {
        // IDLE状態で初期化
        const idleManager = new StateManager(GameState.IDLE);
        expect(idleManager.getCurrentState()).toBe(GameState.IDLE);
        expect(idleManager.canTransition(GameState.IDLE, GameState.SPINNING)).toBe(true);

        // SPINNING状態で初期化
        const spinningManager = new StateManager(GameState.SPINNING);
        expect(spinningManager.getCurrentState()).toBe(GameState.SPINNING);
        expect(spinningManager.canTransition(GameState.SPINNING, GameState.SHOWING_RESULTS)).toBe(true);
        expect(spinningManager.canTransition(GameState.SPINNING, GameState.IDLE)).toBe(false);

        // SHOWING_RESULTS状態で初期化
        const resultsManager = new StateManager(GameState.SHOWING_RESULTS);
        expect(resultsManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
        expect(resultsManager.canTransition(GameState.SHOWING_RESULTS, GameState.IDLE)).toBe(true);
        expect(resultsManager.canTransition(GameState.SHOWING_RESULTS, GameState.SPINNING)).toBe(false);
      });

      test('should handle state consistency when canTransition is called before transitionTo', () => {
        // canTransitionを呼び出しても状態は変更されない
        const initialState = stateManager.getCurrentState();
        
        stateManager.canTransition(GameState.IDLE, GameState.SPINNING);
        expect(stateManager.getCurrentState()).toBe(initialState);
        
        stateManager.canTransition(GameState.IDLE, GameState.SHOWING_RESULTS);
        expect(stateManager.getCurrentState()).toBe(initialState);
        
        // 実際の遷移
        stateManager.transitionTo(GameState.SPINNING);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
      });
    });

    describe('State Consistency Under Stress', () => {
      test('should maintain consistency with interleaved valid and invalid operations', () => {
        type TransitionStep = {
          action: 'transition';
          target: GameState;
          expected: boolean;
          finalState: GameState;
        };

        type CheckStep = {
          action: 'check';
          from: GameState;
          to: GameState;
          expected: boolean;
          finalState: GameState;
        };

        const testSequence: (TransitionStep | CheckStep)[] = [
          { action: 'transition', target: GameState.SPINNING, expected: true, finalState: GameState.SPINNING },
          { action: 'check', from: GameState.SPINNING, to: GameState.IDLE, expected: false, finalState: GameState.SPINNING },
          { action: 'transition', target: GameState.IDLE, expected: false, finalState: GameState.SPINNING },
          { action: 'check', from: GameState.SPINNING, to: GameState.SHOWING_RESULTS, expected: true, finalState: GameState.SPINNING },
          { action: 'transition', target: GameState.SHOWING_RESULTS, expected: true, finalState: GameState.SHOWING_RESULTS },
          { action: 'transition', target: GameState.SPINNING, expected: false, finalState: GameState.SHOWING_RESULTS },
          { action: 'check', from: GameState.SHOWING_RESULTS, to: GameState.IDLE, expected: true, finalState: GameState.SHOWING_RESULTS },
          { action: 'transition', target: GameState.IDLE, expected: true, finalState: GameState.IDLE },
        ];

        for (const step of testSequence) {
          if (step.action === 'transition') {
            const result = stateManager.transitionTo(step.target);
            expect(result).toBe(step.expected);
          } else if (step.action === 'check') {
            const result = stateManager.canTransition(step.from, step.to);
            expect(result).toBe(step.expected);
          }
          expect(stateManager.getCurrentState()).toBe(step.finalState);
        }
      });

      test('should handle edge case of attempting same invalid transition repeatedly', () => {
        // IDLE状態から無効な遷移を繰り返し試行
        for (let i = 0; i < 20; i++) {
          expect(stateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(false);
          expect(stateManager.getCurrentState()).toBe(GameState.IDLE);
        }

        // 有効な遷移は依然として機能するべき
        expect(stateManager.transitionTo(GameState.SPINNING)).toBe(true);
        expect(stateManager.getCurrentState()).toBe(GameState.SPINNING);
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 7: State Transition Consistency', () => {
      /**
       * **検証対象: 要件 6.1, 6.2, 6.3, 6.4, 6.5**
       * 
       * プロパティ: 任意のゲーム状態遷移において、システムは待機 → 回転中 → 結果表示 → 待機の
       * 順序で移動し、無効な遷移を防止するべきです。
       * 
       * このテストは以下を検証します:
       * - スピンがアクティブでない時、待機状態を維持 (要件 6.1)
       * - スピン開始時、回転状態に遷移 (要件 6.2)
       * - 回転状態中、新しいスピン要求を防止 (要件 6.3)
       * - スピンアニメーション完了時、結果状態に遷移 (要件 6.4)
       * - 結果表示後、待機状態に戻る (要件 6.5)
       */
      it('should enforce valid state transition sequence and prevent invalid transitions', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 50 }), // 完全なサイクル数
            (numCycles) => {
              const testStateManager = new StateManager();
              
              // 初期状態は待機状態であるべき (要件 6.1)
              expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
              
              for (let cycle = 0; cycle < numCycles; cycle++) {
                // サイクル開始: 待機状態
                expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
                
                // 待機状態から回転状態への遷移は許可されるべき (要件 6.2)
                expect(testStateManager.canTransition(GameState.IDLE, GameState.SPINNING)).toBe(true);
                expect(testStateManager.transitionTo(GameState.SPINNING)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.SPINNING);
                
                // 回転状態中、待機状態への遷移は防止されるべき (要件 6.3)
                expect(testStateManager.canTransition(GameState.SPINNING, GameState.IDLE)).toBe(false);
                expect(testStateManager.transitionTo(GameState.IDLE)).toBe(false);
                expect(testStateManager.getCurrentState()).toBe(GameState.SPINNING);
                
                // 回転状態から結果表示状態への遷移は許可されるべき (要件 6.4)
                expect(testStateManager.canTransition(GameState.SPINNING, GameState.SHOWING_RESULTS)).toBe(true);
                expect(testStateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
                
                // 結果表示状態から回転状態への遷移は防止されるべき
                expect(testStateManager.canTransition(GameState.SHOWING_RESULTS, GameState.SPINNING)).toBe(false);
                expect(testStateManager.transitionTo(GameState.SPINNING)).toBe(false);
                expect(testStateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
                
                // 結果表示状態から待機状態への遷移は許可されるべき (要件 6.5)
                expect(testStateManager.canTransition(GameState.SHOWING_RESULTS, GameState.IDLE)).toBe(true);
                expect(testStateManager.transitionTo(GameState.IDLE)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
              }
            }
          ),
          { numRuns: 100 } // 設計書で指定された通り100回実行
        );
      });

      /**
       * **検証対象: 要件 6.1, 6.2, 6.3, 6.4, 6.5**
       * 
       * プロパティ: 任意の状態から任意の状態への遷移試行において、
       * 有効な遷移のみが許可され、無効な遷移は拒否されるべきです。
       */
      it('should only allow valid transitions and reject all invalid transitions', () => {
        // すべての可能な状態のペアを生成
        const stateArbitrary = fc.constantFrom(
          GameState.IDLE,
          GameState.SPINNING,
          GameState.SHOWING_RESULTS
        );
        
        fc.assert(
          fc.property(
            stateArbitrary, // 開始状態
            stateArbitrary, // 目標状態
            (fromState, toState) => {
              const testStateManager = new StateManager(fromState);
              
              // 有効な遷移を定義
              const validTransitions: Record<GameState, GameState[]> = {
                [GameState.IDLE]: [GameState.SPINNING],
                [GameState.SPINNING]: [GameState.SHOWING_RESULTS],
                [GameState.SHOWING_RESULTS]: [GameState.IDLE]
              };
              
              const isValidTransition = fromState !== toState && 
                                       validTransitions[fromState]?.includes(toState);
              
              // canTransitionの結果を検証
              expect(testStateManager.canTransition(fromState, toState)).toBe(isValidTransition);
              
              // transitionToの動作を検証
              const transitionResult = testStateManager.transitionTo(toState);
              expect(transitionResult).toBe(isValidTransition);
              
              // 状態が正しく更新されたか検証
              if (isValidTransition) {
                expect(testStateManager.getCurrentState()).toBe(toState);
              } else {
                expect(testStateManager.getCurrentState()).toBe(fromState);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 6.1, 6.2, 6.3, 6.4, 6.5**
       * 
       * プロパティ: 任意の無効な遷移試行において、現在の状態は変更されず、
       * システムは一貫性を維持するべきです。
       */
      it('should maintain state consistency when invalid transitions are attempted', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(GameState.IDLE, GameState.SPINNING, GameState.SHOWING_RESULTS),
            fc.array(
              fc.constantFrom(GameState.IDLE, GameState.SPINNING, GameState.SHOWING_RESULTS),
              { minLength: 1, maxLength: 20 }
            ),
            (initialState, transitionAttempts) => {
              const testStateManager = new StateManager(initialState);
              let currentState = initialState;
              
              for (const targetState of transitionAttempts) {
                const canTransition = testStateManager.canTransition(currentState, targetState);
                const transitionResult = testStateManager.transitionTo(targetState);
                
                // canTransitionとtransitionToの結果は一致するべき
                expect(transitionResult).toBe(canTransition);
                
                // 状態の更新を追跡
                if (canTransition) {
                  currentState = targetState;
                }
                
                // 現在の状態が期待通りであることを検証
                expect(testStateManager.getCurrentState()).toBe(currentState);
                
                // 状態は常に有効であるべき
                expect(testStateManager.isValidState(currentState)).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 6.1, 6.2, 6.3, 6.4, 6.5**
       * 
       * プロパティ: 完全な状態サイクル（待機 → 回転中 → 結果表示 → 待機）は
       * 常に成功し、任意の回数繰り返すことができるべきです。
       */
      it('should successfully complete full state cycles repeatedly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }), // サイクル数
            (numCycles) => {
              const testStateManager = new StateManager();
              
              for (let i = 0; i < numCycles; i++) {
                // 完全なサイクルを実行
                expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
                
                // 待機 → 回転中
                expect(testStateManager.transitionTo(GameState.SPINNING)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.SPINNING);
                
                // 回転中 → 結果表示
                expect(testStateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
                
                // 結果表示 → 待機
                expect(testStateManager.transitionTo(GameState.IDLE)).toBe(true);
                expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
              }
              
              // 最終的に待機状態に戻るべき
              expect(testStateManager.getCurrentState()).toBe(GameState.IDLE);
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 6.3**
       * 
       * プロパティ: 回転状態中、新しいスピン要求（待機状態への遷移）は
       * 常に防止されるべきです。
       */
      it('should prevent new spin requests during spinning state', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 50 }), // 試行回数
            (numAttempts) => {
              const testStateManager = new StateManager();
              
              // 回転状態に遷移
              testStateManager.transitionTo(GameState.SPINNING);
              expect(testStateManager.getCurrentState()).toBe(GameState.SPINNING);
              
              // 回転状態中、複数回の無効な遷移試行
              for (let i = 0; i < numAttempts; i++) {
                // 待機状態への遷移は拒否されるべき
                expect(testStateManager.canTransition(GameState.SPINNING, GameState.IDLE)).toBe(false);
                expect(testStateManager.transitionTo(GameState.IDLE)).toBe(false);
                
                // 自己遷移も拒否されるべき
                expect(testStateManager.canTransition(GameState.SPINNING, GameState.SPINNING)).toBe(false);
                expect(testStateManager.transitionTo(GameState.SPINNING)).toBe(false);
                
                // 状態は回転中のまま維持されるべき
                expect(testStateManager.getCurrentState()).toBe(GameState.SPINNING);
              }
              
              // 有効な遷移（結果表示状態へ）は依然として可能であるべき
              expect(testStateManager.canTransition(GameState.SPINNING, GameState.SHOWING_RESULTS)).toBe(true);
              expect(testStateManager.transitionTo(GameState.SHOWING_RESULTS)).toBe(true);
              expect(testStateManager.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});