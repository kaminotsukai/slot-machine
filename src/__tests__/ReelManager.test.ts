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
        { id: 'test2', name: 'Test2', displayValue: '🎲' }
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
    it('should return exactly 3 symbols', async () => {
      const result = await reelManager.spinReels();
      expect(result).toHaveLength(3);
    });

    it('should return valid symbols from the symbol set', async () => {
      const result = await reelManager.spinReels();
      result.forEach(symbol => {
        expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
      });
    });

    it('should generate independent results for each reel', async () => {
      const results = [];
      // Run multiple spins to check independence
      for (let i = 0; i < 10; i++) {
        results.push(await reelManager.spinReels());
      }
      
      // Check that not all spins are identical (very unlikely with random generation)
      const uniqueResults = new Set(results.map(r => JSON.stringify(r)));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe('validateSymbolSet', () => {
    it('should return true for valid symbol set', () => {
      const validSymbols: Symbol[] = [
        { id: 'test', name: 'Test', displayValue: '🎯' }
      ];
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
    describe('Property 3: Random Symbol Generation', () => {
      /**
       * **Validates: Requirements 3.2, 3.5**
       * 
       * Property: For any spin operation, each of the 3 reels should independently 
       * generate symbols with equal probability distribution across the entire symbol set.
       * 
       * This test verifies:
       * - Each reel generates symbols independently (requirement 3.2)
       * - Each symbol has equal probability of appearing (requirement 3.5)
       */
      it('should generate symbols with equal probability distribution across all reels', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 200, max: 1000 }), // Number of spins to test
            async (numSpins) => {
              const symbolCounts = new Map<string, number>();
              const reelSymbolCounts: Map<string, number>[] = [
                new Map<string, number>(),
                new Map<string, number>(),
                new Map<string, number>()
              ];

              // Initialize counters
              DEFAULT_SYMBOLS.forEach(symbol => {
                symbolCounts.set(symbol.id, 0);
                reelSymbolCounts.forEach(reelMap => reelMap.set(symbol.id, 0));
              });

              // Perform multiple spins and count symbol occurrences
              for (let i = 0; i < numSpins; i++) {
                const spinResult = await reelManager.spinReels();
                
                // Count symbols for each reel independently
                spinResult.forEach((symbol, reelIndex) => {
                  const currentCount = symbolCounts.get(symbol.id) || 0;
                  symbolCounts.set(symbol.id, currentCount + 1);
                  
                  const reelCount = reelSymbolCounts[reelIndex]!.get(symbol.id) || 0;
                  reelSymbolCounts[reelIndex]!.set(symbol.id, reelCount + 1);
                });
              }

              // Verify each symbol appears at least once across all spins
              DEFAULT_SYMBOLS.forEach(symbol => {
                const count = symbolCounts.get(symbol.id) || 0;
                expect(count).toBeGreaterThan(0);
              });

              // Verify distribution is reasonably uniform
              // Each symbol should appear roughly numSpins * 3 / symbolCount times
              const expectedFrequency = (numSpins * 3) / DEFAULT_SYMBOLS.length;
              const tolerance = expectedFrequency * 0.7; // 70% tolerance for randomness

              DEFAULT_SYMBOLS.forEach(symbol => {
                const count = symbolCounts.get(symbol.id) || 0;
                expect(count).toBeGreaterThanOrEqual(expectedFrequency - tolerance);
                expect(count).toBeLessThanOrEqual(expectedFrequency + tolerance);
              });

              // Verify independence: each reel should have roughly equal distribution
              reelSymbolCounts.forEach((reelMap) => {
                const expectedReelFrequency = numSpins / DEFAULT_SYMBOLS.length;
                const reelTolerance = Math.max(expectedReelFrequency * 0.9, 5); // 90% tolerance or minimum 5

                DEFAULT_SYMBOLS.forEach(symbol => {
                  const reelCount = reelMap.get(symbol.id) || 0;
                  expect(reelCount).toBeGreaterThanOrEqual(Math.max(0, expectedReelFrequency - reelTolerance));
                  expect(reelCount).toBeLessThanOrEqual(expectedReelFrequency + reelTolerance);
                });
              });
            }
          ),
          { numRuns: 100 } // Run the property test 100 times as specified in design
        );
      });

      /**
       * **Validates: Requirements 3.2, 3.5**
       * 
       * Property: Each individual symbol generation should return a valid symbol 
       * from the symbol set with equal probability.
       */
      it('should generate individual symbols with uniform distribution', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 500, max: 2000 }), // Number of individual generations
            (numGenerations) => {
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

    describe('Property 4: Reel Display Consistency', () => {
      /**
       * **Validates: Requirements 3.3, 3.4**
       * 
       * Property: For any completed spin, each reel should display exactly one symbol 
       * from the consistent symbol set.
       * 
       * This test verifies:
       * - Each reel displays exactly 1 symbol when stopped (requirement 3.3)
       * - All reels use consistent symbol set (requirement 3.4)
       */
      it('should display exactly one symbol per reel from consistent symbol set', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 50 }), // Number of spins to test
            async (numSpins) => {
              for (let i = 0; i < numSpins; i++) {
                const spinResult = await reelManager.spinReels();
                
                // Verify exactly 3 symbols are returned (one per reel)
                expect(spinResult).toHaveLength(3);
                
                // Verify each symbol is from the consistent symbol set
                spinResult.forEach((symbol) => {
                  // Each symbol must be valid and from the symbol set
                  expect(symbol).toBeDefined();
                  expect(symbol).toHaveProperty('id');
                  expect(symbol).toHaveProperty('name');
                  expect(symbol).toHaveProperty('displayValue');
                  
                  // Symbol must be from the consistent symbol set
                  const isFromSymbolSet = DEFAULT_SYMBOLS.some(s => 
                    s.id === symbol.id && 
                    s.name === symbol.name && 
                    s.displayValue === symbol.displayValue
                  );
                  expect(isFromSymbolSet).toBe(true);
                  
                  // Verify symbol structure integrity
                  expect(typeof symbol.id).toBe('string');
                  expect(typeof symbol.name).toBe('string');
                  expect(typeof symbol.displayValue).toBe('string');
                  expect(symbol.id.length).toBeGreaterThan(0);
                  expect(symbol.name.length).toBeGreaterThan(0);
                  expect(symbol.displayValue.length).toBeGreaterThan(0);
                });
                
                // Verify reel count consistency
                expect(reelManager.getReelCount()).toBe(3);
              }
            }
          ),
          { numRuns: 100 } // Run the property test 100 times as specified in design
        );
      });

      /**
       * **Validates: Requirements 3.3, 3.4**
       * 
       * Property: Symbol set consistency should be maintained across all operations.
       */
      it('should maintain symbol set consistency across multiple operations', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10, max: 100 }), // Number of operations to test
            (numOperations) => {
              const initialSymbolSet = reelManager.getSymbolSet();
              
              for (let i = 0; i < numOperations; i++) {
                // Generate individual symbols
                const symbol = reelManager.generateRandomSymbol();
                
                // Verify symbol is from consistent set
                const isFromInitialSet = initialSymbolSet.some(s => 
                  s.id === symbol.id && 
                  s.name === symbol.name && 
                  s.displayValue === symbol.displayValue
                );
                expect(isFromInitialSet).toBe(true);
                
                // Verify symbol set hasn't changed
                const currentSymbolSet = reelManager.getSymbolSet();
                expect(currentSymbolSet).toEqual(initialSymbolSet);
                
                // Verify reel count remains consistent
                expect(reelManager.getReelCount()).toBe(3);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **Validates: Requirements 3.3, 3.4**
       * 
       * Property: Each reel position should independently display symbols from the same consistent set.
       */
      it('should ensure each reel position uses the same consistent symbol set', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 20, max: 100 }), // Number of spins to analyze
            async (numSpins) => {
              const reelPositionSymbols: Set<string>[] = [
                new Set<string>(),
                new Set<string>(),
                new Set<string>()
              ];
              
              // Collect symbols from each reel position
              for (let i = 0; i < numSpins; i++) {
                const spinResult = await reelManager.spinReels();
                
                spinResult.forEach((symbol, reelIndex) => {
                  reelPositionSymbols[reelIndex]!.add(symbol.id);
                });
              }
              
              // Verify each reel position can produce symbols from the consistent set
              const expectedSymbolIds = new Set(DEFAULT_SYMBOLS.map(s => s.id));
              
              reelPositionSymbols.forEach((reelSymbols) => {
                // Each reel should only produce symbols from the expected set
                reelSymbols.forEach(symbolId => {
                  expect(expectedSymbolIds.has(symbolId)).toBe(true);
                });
                
                // With enough spins, each reel should be capable of producing multiple different symbols
                if (numSpins >= 50) {
                  expect(reelSymbols.size).toBeGreaterThan(1);
                }
              });
              
              // Verify all reels use the same symbol set (consistency)
              // Each reel should be capable of producing the same symbols given enough trials
              if (numSpins >= 80) {
                const allReelSymbols = new Set<string>();
                reelPositionSymbols.forEach(reelSymbols => {
                  reelSymbols.forEach(symbolId => allReelSymbols.add(symbolId));
                });
                
                // All reels combined should cover a significant portion of available symbols
                expect(allReelSymbols.size).toBeGreaterThanOrEqual(Math.min(5, DEFAULT_SYMBOLS.length));
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});