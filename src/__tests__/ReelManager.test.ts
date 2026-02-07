import { ReelManager } from '../ReelManager';
import { Symbol, DEFAULT_SYMBOLS } from '../types';
import * as fc from 'fast-check';

describe('ReelManager', () => {
  let reelManager: ReelManager;

  beforeEach(() => {
    reelManager = new ReelManager();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default symbols', () => {
      expect(reelManager.getSymbolSet()).toEqual(DEFAULT_SYMBOLS);
    });

    it('should initialize with custom symbols when provided', () => {
      const customSymbols: Symbol[] = [
        { id: 'test1', name: 'Test1', displayValue: '🎯' },
        { id: 'test2', name: 'Test2', displayValue: '🎲' },
      ];
      const customReelManager = new ReelManager(customSymbols);
      expect(customReelManager.getSymbolSet()).toEqual(customSymbols);
    });

    it('should throw error for invalid symbol set', () => {
      const invalidSymbols: Symbol[] = [];
      expect(() => new ReelManager(invalidSymbols)).toThrow('Invalid symbol set provided');
    });
  });

  describe('getReelCount', () => {
    it('should return exactly 3 reels', () => {
      expect(reelManager.getReelCount()).toBe(3);
    });
  });

  describe('generateRandomSymbol', () => {
    it('should return a symbol from the symbol set', () => {
      const symbol = reelManager.generateRandomSymbol();
      expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
    });

    it('should return valid symbol structure', () => {
      const symbol = reelManager.generateRandomSymbol();
      expect(symbol).toHaveProperty('id');
      expect(symbol).toHaveProperty('name');
      expect(symbol).toHaveProperty('displayValue');
      expect(typeof symbol.id).toBe('string');
      expect(typeof symbol.name).toBe('string');
      expect(typeof symbol.displayValue).toBe('string');
    });

    it('should generate different symbols over multiple calls', () => {
      const symbols = new Set();
      // Generate many symbols to increase chance of getting different ones
      for (let i = 0; i < 100; i++) {
        symbols.add(reelManager.generateRandomSymbol().id);
      }
      // With 7 symbols and 100 calls, we should get more than 1 unique symbol
      expect(symbols.size).toBeGreaterThan(1);
    });
  });

  describe('spinReels', () => {
    it('should set all reels to spinning state', () => {
      reelManager.spinReels();

      // すべてのリールが回転中であることを確認
      expect(reelManager.isReelSpinning(0)).toBe(true);
      expect(reelManager.isReelSpinning(1)).toBe(true);
      expect(reelManager.isReelSpinning(2)).toBe(true);
    });

    it('should clear previous symbols when spinning', () => {
      // 最初のスピンと停止
      reelManager.spinReels();
      reelManager.stopReel(0);
      reelManager.stopReel(1);
      reelManager.stopReel(2);

      // 新しいスピン
      reelManager.spinReels();

      // すべてのリールが回転中になっていることを確認
      expect(reelManager.isReelSpinning(0)).toBe(true);
      expect(reelManager.isReelSpinning(1)).toBe(true);
      expect(reelManager.isReelSpinning(2)).toBe(true);

      // 回転中のリールは現在のシンボルを返す
      const symbols = reelManager.getAllReelSymbols();
      symbols.forEach(symbol => {
        expect(symbol).not.toBeNull();
      });
    });
  });

  describe('stopReel', () => {
    beforeEach(() => {
      reelManager.spinReels();
    });

    it('should stop a specific reel and return a symbol', () => {
      const symbol = reelManager.stopReel(0);

      expect(symbol).toBeDefined();
      expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
      expect(reelManager.isReelSpinning(0)).toBe(false);
    });

    it('should only stop the specified reel', () => {
      reelManager.stopReel(0);

      expect(reelManager.isReelSpinning(0)).toBe(false);
      expect(reelManager.isReelSpinning(1)).toBe(true);
      expect(reelManager.isReelSpinning(2)).toBe(true);
    });

    it('should throw error when stopping already stopped reel', () => {
      reelManager.stopReel(0);

      expect(() => reelManager.stopReel(0)).toThrow('already stopped');
    });

    it('should throw error for invalid reel index', () => {
      expect(() => reelManager.stopReel(-1)).toThrow('Invalid reel index');
      expect(() => reelManager.stopReel(3)).toThrow('Invalid reel index');
    });
  });

  describe('getAllReelSymbols', () => {
    it('should return current symbols for spinning reels', () => {
      reelManager.spinReels();

      const symbols = reelManager.getAllReelSymbols();
      // 回転中のリールは現在のシンボルを返す
      expect(symbols.length).toBe(3);
      symbols.forEach(symbol => {
        expect(symbol).not.toBeNull();
      });
    });

    it('should return symbols for stopped reels and current symbols for spinning reels', () => {
      reelManager.spinReels();
      const symbol1 = reelManager.stopReel(0);
      const symbol2 = reelManager.stopReel(1);

      const symbols = reelManager.getAllReelSymbols();
      expect(symbols[0]).toEqual(symbol1);
      expect(symbols[1]).toEqual(symbol2);
      // リール2は回転中なので現在のシンボルを返す
      expect(symbols[2]).not.toBeNull();
    });
  });

  describe('validateSymbolSet', () => {
    it('should return true for valid symbol set', () => {
      const validSymbols: Symbol[] = [{ id: 'test', name: 'Test', displayValue: '🎯' }];
      expect(reelManager.validateSymbolSet(validSymbols)).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(reelManager.validateSymbolSet([])).toBe(false);
    });

    it('should return false for non-array input', () => {
      expect(reelManager.validateSymbolSet(null as any)).toBe(false);
      expect(reelManager.validateSymbolSet(undefined as any)).toBe(false);
    });

    it('should return false for symbols with missing properties', () => {
      const invalidSymbols = [
        { id: '', name: 'Test', displayValue: '🎯' }, // empty id
        { id: 'test', name: '', displayValue: '🎯' }, // empty name
        { id: 'test', name: 'Test', displayValue: '' }, // empty displayValue
        { name: 'Test', displayValue: '🎯' } as any, // missing id
      ];

      invalidSymbols.forEach(invalidSet => {
        expect(reelManager.validateSymbolSet([invalidSet])).toBe(false);
      });
    });
  });

  describe('getSymbolSet', () => {
    it('should return a copy of the symbol set', () => {
      const symbolSet = reelManager.getSymbolSet();
      expect(symbolSet).toEqual(DEFAULT_SYMBOLS);

      // Modify the returned array
      symbolSet.push({ id: 'new', name: 'New', displayValue: '🆕' });

      // Original should be unchanged
      expect(reelManager.getSymbolSet()).toEqual(DEFAULT_SYMBOLS);
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 4: Random Symbol Generation Fairness', () => {
      /**
       * **Validates: Requirements 3.2, 3.7**
       *
       * Property: For any spin operation, each reel should independently
       * generate symbols with equal probability distribution across the entire symbol set.
       */
      it('should generate symbols with equal probability distribution', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 500, max: 2000 }), // Number of individual generations
            numGenerations => {
              const symbolCounts = new Map<string, number>();

              // Initialize counters
              DEFAULT_SYMBOLS.forEach(symbol => {
                symbolCounts.set(symbol.id, 0);
              });

              // Generate symbols and count occurrences
              for (let i = 0; i < numGenerations; i++) {
                const symbol = reelManager.generateRandomSymbol();

                // Verify symbol is from the valid set
                expect(DEFAULT_SYMBOLS.some(s => s.id === symbol.id)).toBe(true);

                const currentCount = symbolCounts.get(symbol.id) || 0;
                symbolCounts.set(symbol.id, currentCount + 1);
              }

              // Verify uniform distribution
              const expectedFrequency = numGenerations / DEFAULT_SYMBOLS.length;
              const tolerance = expectedFrequency * 0.5; // 50% tolerance

              DEFAULT_SYMBOLS.forEach(symbol => {
                const count = symbolCounts.get(symbol.id) || 0;
                expect(count).toBeGreaterThanOrEqual(expectedFrequency - tolerance);
                expect(count).toBeLessThanOrEqual(expectedFrequency + tolerance);
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property 5: Stopped Reel State Maintenance', () => {
      /**
       * **Validates: Requirements 3.4, 3.5, 3.6**
       *
       * Property: In any partially stopped state, stopped reel symbols should not change
       * while other reels are spinning, display exactly one symbol, and be from the consistent symbol set.
       */
      it('should maintain stopped reel state while other reels spin', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 1, maxLength: 3 }), // Which reels to stop
            reelsToStop => {
              // Remove duplicates
              const uniqueReels = Array.from(new Set(reelsToStop)).sort();

              // Start spinning
              reelManager.spinReels();

              // Stop specified reels and record their symbols
              const stoppedSymbols = new Map<number, Symbol>();
              uniqueReels.forEach(reelIndex => {
                const symbol = reelManager.stopReel(reelIndex);
                stoppedSymbols.set(reelIndex, symbol);

                // Verify symbol is from consistent set
                expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
              });

              // Verify stopped reels maintain their state
              const currentSymbols = reelManager.getAllReelSymbols();
              uniqueReels.forEach(reelIndex => {
                const stoppedSymbol = stoppedSymbols.get(reelIndex);
                const currentSymbol = currentSymbols[reelIndex];

                // Stopped reel should display exactly one symbol
                expect(currentSymbol).not.toBeNull();
                expect(currentSymbol).toEqual(stoppedSymbol);

                // Reel should not be spinning
                expect(reelManager.isReelSpinning(reelIndex)).toBe(false);
              });

              // Verify other reels are still spinning
              for (let i = 0; i < 3; i++) {
                if (!uniqueReels.includes(i)) {
                  expect(reelManager.isReelSpinning(i)).toBe(true);
                  // 回転中のリールは現在のシンボルを返す（nullではない）
                  expect(currentSymbols[i]).not.toBeNull();
                }
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
