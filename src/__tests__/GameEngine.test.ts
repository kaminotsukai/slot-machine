import { GameEngine } from '../GameEngine';
import { GameState } from '../types';

describe('GameEngine', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine();
  });

  describe('初期化', () => {
    test('初期状態はIDLE', () => {
      expect(gameEngine.getCurrentState()).toBe(GameState.IDLE);
    });

    test('初期状態ではスピン可能', () => {
      expect(gameEngine.canSpin()).toBe(true);
    });

    test('シンボルセットが取得できる', () => {
      const symbols = gameEngine.getSymbols();
      expect(symbols).toBeDefined();
      expect(symbols.length).toBeGreaterThan(0);
    });

    test('勝利条件が取得できる', () => {
      const conditions = gameEngine.getWinConditions();
      expect(conditions).toBeDefined();
      expect(Array.isArray(conditions)).toBe(true);
    });
  });

  describe('canSpin', () => {
    test('IDLE状態の時はtrueを返す', () => {
      expect(gameEngine.canSpin()).toBe(true);
    });

    test('SPINNING状態の時はfalseを返す', () => {
      gameEngine.initiateSpin();
      expect(gameEngine.canSpin()).toBe(false);
    });
  });

  describe('initiateSpin', () => {
    test('スピンが正常に開始され、状態がSPINNINGになる', () => {
      gameEngine.initiateSpin();
      expect(gameEngine.getCurrentState()).toBe(GameState.SPINNING);
    });

    test('スピン開始後、すべてのリールが回転中になる', () => {
      gameEngine.initiateSpin();
      expect(gameEngine.isReelSpinning(0)).toBe(true);
      expect(gameEngine.isReelSpinning(1)).toBe(true);
      expect(gameEngine.isReelSpinning(2)).toBe(true);
    });

    test('IDLE状態でない時はエラーをスローする', () => {
      gameEngine.initiateSpin();
      expect(() => gameEngine.initiateSpin()).toThrow();
    });
  });

  describe('stopReel', () => {
    beforeEach(() => {
      gameEngine.initiateSpin();
    });

    test('リールを停止し、シンボルを返す', () => {
      const symbol = gameEngine.stopReel(0);
      expect(symbol).toBeDefined();
      expect(symbol).toHaveProperty('id');
      expect(symbol).toHaveProperty('displayValue');
    });

    test('リール停止後、そのリールは回転していない', () => {
      gameEngine.stopReel(0);
      expect(gameEngine.isReelSpinning(0)).toBe(false);
    });

    test('一つのリールを停止しても他のリールは回転中', () => {
      gameEngine.stopReel(0);
      expect(gameEngine.isReelSpinning(1)).toBe(true);
      expect(gameEngine.isReelSpinning(2)).toBe(true);
    });

    test('最初のリール停止後、状態がPARTIALLY_STOPPEDになる', () => {
      gameEngine.stopReel(0);
      expect(gameEngine.getCurrentState()).toBe(GameState.PARTIALLY_STOPPED);
    });

    test('すべてのリールを停止すると状態がSHOWING_RESULTSになる', () => {
      gameEngine.stopReel(0);
      gameEngine.stopReel(1);
      gameEngine.stopReel(2);
      expect(gameEngine.getCurrentState()).toBe(GameState.SHOWING_RESULTS);
    });

    test('既に停止したリールを停止しようとするとエラー', () => {
      gameEngine.stopReel(0);
      expect(() => gameEngine.stopReel(0)).toThrow();
    });

    test('任意の順番でリールを停止できる', () => {
      gameEngine.stopReel(2);
      gameEngine.stopReel(0);
      gameEngine.stopReel(1);
      expect(gameEngine.areAllReelsStopped()).toBe(true);
    });
  });

  describe('getCurrentReelSymbols', () => {
    test('スピン前はすべてnull', () => {
      const symbols = gameEngine.getCurrentReelSymbols();
      expect(symbols).toEqual([null, null, null]);
    });

    test('スピン中は現在のシンボルを返す', () => {
      gameEngine.initiateSpin();
      const symbols = gameEngine.getCurrentReelSymbols();
      expect(symbols.length).toBe(3);
      // 回転中なので各シンボルが存在する
      symbols.forEach(symbol => {
        expect(symbol).not.toBeNull();
      });
    });

    test('一部停止後、停止したリールのシンボルは固定される', () => {
      gameEngine.initiateSpin();
      const symbol0 = gameEngine.stopReel(0);

      const symbols = gameEngine.getCurrentReelSymbols();
      expect(symbols[0]).toEqual(symbol0);
      expect(symbols[1]).not.toBeNull();
      expect(symbols[2]).not.toBeNull();
    });
  });

  describe('evaluateResult', () => {
    beforeEach(() => {
      gameEngine.initiateSpin();
      gameEngine.stopReel(0);
      gameEngine.stopReel(1);
      gameEngine.stopReel(2);
    });

    test('すべてのリールが停止した後、結果を評価できる', () => {
      const result = gameEngine.evaluateResult();
      expect(result).toBeDefined();
      expect(result.symbols).toBeDefined();
      expect(result.symbols.length).toBe(3);
      expect(result.winResult).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('評価後、状態がIDLEに戻る', () => {
      gameEngine.evaluateResult();
      expect(gameEngine.getCurrentState()).toBe(GameState.IDLE);
    });

    test('すべてのリールが停止していない時はエラー', () => {
      // このテストは独自のセットアップが必要なので、新しいインスタンスを使用
      const testEngine = new GameEngine();
      testEngine.initiateSpin();
      testEngine.stopReel(0);
      expect(() => testEngine.evaluateResult()).toThrow();
    });
  });

  describe('areAllReelsStopped', () => {
    test('スピン前はtrue', () => {
      expect(gameEngine.areAllReelsStopped()).toBe(true);
    });

    test('スピン中はfalse', () => {
      gameEngine.initiateSpin();
      expect(gameEngine.areAllReelsStopped()).toBe(false);
    });

    test('一部停止後はfalse', () => {
      gameEngine.initiateSpin();
      gameEngine.stopReel(0);
      expect(gameEngine.areAllReelsStopped()).toBe(false);
    });

    test('すべて停止後はtrue', () => {
      gameEngine.initiateSpin();
      gameEngine.stopReel(0);
      gameEngine.stopReel(1);
      gameEngine.stopReel(2);
      expect(gameEngine.areAllReelsStopped()).toBe(true);
    });
  });
});
