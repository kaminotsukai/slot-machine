/**
 * Basic setup tests to verify project structure and core types
 */

import { GameState, DEFAULT_SYMBOLS, Symbol, SpinResult, WinResult, WinCondition } from '../types';

describe('Project Setup', () => {
  describe('Core Types', () => {
    test('GameState enum should have correct values', () => {
      expect(GameState.IDLE).toBe('idle');
      expect(GameState.SPINNING).toBe('spinning');
      expect(GameState.SHOWING_RESULTS).toBe('showing_results');
    });

    test('DEFAULT_SYMBOLS should contain expected symbols', () => {
      expect(DEFAULT_SYMBOLS).toHaveLength(7);
      expect(DEFAULT_SYMBOLS[0]).toEqual({
        id: 'cherry',
        name: 'Cherry',
        displayValue: '🍒',
      });
    });

    test('Symbol interface should be properly typed', () => {
      const symbol: Symbol = {
        id: 'test',
        name: 'Test Symbol',
        displayValue: '🧪',
      };

      expect(symbol.id).toBe('test');
      expect(symbol.name).toBe('Test Symbol');
      expect(symbol.displayValue).toBe('🧪');
    });

    test('SpinResult interface should be properly typed', () => {
      const winResult: WinResult = {
        isWin: true,
        winType: 'three-of-a-kind',
        message: 'You won!',
      };

      const spinResult: SpinResult = {
        symbols: DEFAULT_SYMBOLS.slice(0, 3),
        winResult,
        timestamp: new Date(),
      };

      expect(spinResult.symbols).toHaveLength(3);
      expect(spinResult.winResult.isWin).toBe(true);
      expect(spinResult.timestamp).toBeInstanceOf(Date);
    });

    test('WinCondition interface should be properly typed', () => {
      const winCondition: WinCondition = {
        id: 'three-of-a-kind',
        name: 'Three of a Kind',
        pattern: (symbols: Symbol[]) => {
          if (symbols.length !== 3 || !symbols[0]) return false;
          const firstSymbol = symbols[0];
          return symbols.every(s => s.id === firstSymbol.id);
        },
        message: 'Three of a kind!',
      };

      expect(winCondition.id).toBe('three-of-a-kind');
      expect(typeof winCondition.pattern).toBe('function');

      // Test the pattern function with guaranteed non-undefined symbols
      const matchingSymbols: Symbol[] = [
        DEFAULT_SYMBOLS[0]!,
        DEFAULT_SYMBOLS[0]!,
        DEFAULT_SYMBOLS[0]!,
      ];
      const nonMatchingSymbols: Symbol[] = [
        DEFAULT_SYMBOLS[0]!,
        DEFAULT_SYMBOLS[1]!,
        DEFAULT_SYMBOLS[2]!,
      ];

      expect(winCondition.pattern(matchingSymbols)).toBe(true);
      expect(winCondition.pattern(nonMatchingSymbols)).toBe(false);
    });
  });

  describe('Project Structure', () => {
    test('All core types should be importable', () => {
      // Test that all types can be imported without errors
      expect(typeof GameState).toBe('object');
      expect(Array.isArray(DEFAULT_SYMBOLS)).toBe(true);

      // Test that we can create instances of each interface type
      const symbol: Symbol = { id: 'test', name: 'Test', displayValue: '🧪' };
      const winResult: WinResult = { isWin: false, message: 'Try again' };
      const winCondition: WinCondition = {
        id: 'test',
        name: 'Test',
        pattern: () => false,
        message: 'Test',
      };
      const spinResult: SpinResult = {
        symbols: [symbol],
        winResult,
        timestamp: new Date(),
      };

      expect(symbol.id).toBe('test');
      expect(winResult.isWin).toBe(false);
      expect(winCondition.id).toBe('test');
      expect(spinResult.symbols).toHaveLength(1);
    });
  });
});
