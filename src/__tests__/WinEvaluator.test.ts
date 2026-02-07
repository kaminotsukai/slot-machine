/**
 * WinEvaluatorクラスのユニットテスト
 * 勝敗判定ロジックとメッセージ生成をテスト
 */

import { WinEvaluator } from '../WinEvaluator';
import { Symbol, WinResult, WinCondition, DEFAULT_SYMBOLS } from '../types';
import * as fc from 'fast-check';

describe('WinEvaluator', () => {
  let winEvaluator: WinEvaluator;

  beforeEach(() => {
    winEvaluator = new WinEvaluator();
  });

  describe('初期化', () => {
    it('デフォルトの勝利条件で初期化される', () => {
      const conditions = winEvaluator.getWinConditions();
      expect(conditions).toHaveLength(1);
      expect(conditions[0]!.id).toBe('three_of_a_kind');
      expect(conditions[0]!.name).toBe('3つ揃い');
    });

    it('勝利条件の配列のコピーを返す', () => {
      const conditions1 = winEvaluator.getWinConditions();
      const conditions2 = winEvaluator.getWinConditions();
      
      expect(conditions1).toEqual(conditions2);
      expect(conditions1).not.toBe(conditions2); // 異なるオブジェクト参照
    });
  });

  describe('evaluateResult', () => {
    describe('勝利ケース', () => {
      it('3つの同一シンボルで勝利を判定する', () => {
        const cherrySymbol = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
        const symbols = [cherrySymbol, cherrySymbol, cherrySymbol];
        
        const result = winEvaluator.evaluateResult(symbols);
        
        expect(result.isWin).toBe(true);
        expect(result.winType).toBe('three_of_a_kind');
        expect(result.message).toContain('おめでとうございます');
      });

      it('異なるシンボルでも3つ揃えば勝利', () => {
        const sevenSymbol = DEFAULT_SYMBOLS.find(s => s.id === 'seven')!;
        const symbols = [sevenSymbol, sevenSymbol, sevenSymbol];
        
        const result = winEvaluator.evaluateResult(symbols);
        
        expect(result.isWin).toBe(true);
        expect(result.winType).toBe('three_of_a_kind');
      });
    });

    describe('敗北ケース', () => {
      it('異なるシンボルの組み合わせで敗北を判定する', () => {
        const cherry = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
        const lemon = DEFAULT_SYMBOLS.find(s => s.id === 'lemon')!;
        const orange = DEFAULT_SYMBOLS.find(s => s.id === 'orange')!;
        const symbols = [cherry, lemon, orange];
        
        const result = winEvaluator.evaluateResult(symbols);
        
        expect(result.isWin).toBe(false);
        expect(result.winType).toBeUndefined();
        expect(result.message).toContain('残念');
        expect(result.message).toContain(cherry.displayValue);
        expect(result.message).toContain(lemon.displayValue);
        expect(result.message).toContain(orange.displayValue);
      });

      it('2つ同じで1つ異なる場合は敗北', () => {
        const cherry = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
        const lemon = DEFAULT_SYMBOLS.find(s => s.id === 'lemon')!;
        const symbols = [cherry, cherry, lemon];
        
        const result = winEvaluator.evaluateResult(symbols);
        
        expect(result.isWin).toBe(false);
        expect(result.message).toContain('残念');
      });
    });

    describe('エラーケース', () => {
      it('nullまたはundefinedの入力でエラーメッセージを返す', () => {
        const result1 = winEvaluator.evaluateResult(null as any);
        const result2 = winEvaluator.evaluateResult(undefined as any);
        
        expect(result1.isWin).toBe(false);
        expect(result1.message).toContain('エラー');
        expect(result2.isWin).toBe(false);
        expect(result2.message).toContain('エラー');
      });

      it('3つ以外のシンボル数でエラーメッセージを返す', () => {
        const cherry = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
        
        const result1 = winEvaluator.evaluateResult([]);
        const result2 = winEvaluator.evaluateResult([cherry]);
        const result3 = winEvaluator.evaluateResult([cherry, cherry]);
        const result4 = winEvaluator.evaluateResult([cherry, cherry, cherry, cherry]);
        
        [result1, result2, result3, result4].forEach(result => {
          expect(result.isWin).toBe(false);
          expect(result.message).toContain('エラー');
        });
      });

      it('無効なシンボルでエラーメッセージを返す', () => {
        const validSymbol = DEFAULT_SYMBOLS[0]!;
        const invalidSymbols = [
          { id: '', name: 'Test', displayValue: '🎯' }, // 空のid
          { id: 'test', name: '', displayValue: '🎯' }, // 空のname
          { id: 'test', name: 'Test', displayValue: '' }, // 空のdisplayValue
          null as any, // null
          undefined as any, // undefined
        ];

        invalidSymbols.forEach(invalidSymbol => {
          const result = winEvaluator.evaluateResult([validSymbol, validSymbol, invalidSymbol]);
          expect(result.isWin).toBe(false);
          expect(result.message).toContain('エラー');
        });
      });
    });
  });

  describe('isWinningCombination', () => {
    it('勝利の組み合わせでtrueを返す', () => {
      const cherrySymbol = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
      const symbols = [cherrySymbol, cherrySymbol, cherrySymbol];
      
      expect(winEvaluator.isWinningCombination(symbols)).toBe(true);
    });

    it('敗北の組み合わせでfalseを返す', () => {
      const cherry = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
      const lemon = DEFAULT_SYMBOLS.find(s => s.id === 'lemon')!;
      const symbols = [cherry, lemon, cherry];
      
      expect(winEvaluator.isWinningCombination(symbols)).toBe(false);
    });

    it('無効な入力でfalseを返す', () => {
      expect(winEvaluator.isWinningCombination(null as any)).toBe(false);
      expect(winEvaluator.isWinningCombination(undefined as any)).toBe(false);
      expect(winEvaluator.isWinningCombination([])).toBe(false);
      expect(winEvaluator.isWinningCombination([DEFAULT_SYMBOLS[0]!])).toBe(false);
    });

    it('無効なシンボルでfalseを返す', () => {
      const validSymbol = DEFAULT_SYMBOLS[0]!;
      const invalidSymbol = { id: '', name: '', displayValue: '' };
      
      expect(winEvaluator.isWinningCombination([validSymbol, validSymbol, invalidSymbol])).toBe(false);
    });
  });

  describe('addWinCondition', () => {
    it('新しい勝利条件を追加できる', () => {
      const newCondition: WinCondition = {
        id: 'test_condition',
        name: 'テスト条件',
        pattern: (symbols) => symbols.length >= 2 && symbols[0]!.id === 'cherry' && symbols[1]!.id === 'lemon',
        message: 'テスト勝利！'
      };

      winEvaluator.addWinCondition(newCondition);
      const conditions = winEvaluator.getWinConditions();
      
      expect(conditions).toHaveLength(2);
      expect(conditions.find(c => c.id === 'test_condition')).toEqual(newCondition);
    });

    it('同じIDの条件を更新できる', () => {
      const updatedCondition: WinCondition = {
        id: 'three_of_a_kind',
        name: '更新された3つ揃い',
        pattern: (symbols) => symbols.every(s => s.id === 'cherry'),
        message: '更新されたメッセージ'
      };

      winEvaluator.addWinCondition(updatedCondition);
      const conditions = winEvaluator.getWinConditions();
      
      expect(conditions).toHaveLength(1);
      expect(conditions[0]).toEqual(updatedCondition);
    });

    it('無効な勝利条件でエラーを投げる', () => {
      const invalidConditions = [
        null as any,
        undefined as any,
        { id: '', name: 'Test', pattern: () => true, message: 'Test' }, // 空のid
        { id: 'test', name: '', pattern: () => true, message: 'Test' }, // 空のname
        { id: 'test', name: 'Test', pattern: null, message: 'Test' }, // nullのpattern
        { id: 'test', name: 'Test', pattern: () => true, message: '' }, // 空のmessage
      ];

      invalidConditions.forEach(condition => {
        expect(() => winEvaluator.addWinCondition(condition)).toThrow('無効な勝利条件です');
      });
    });
  });

  describe('getWinConditions', () => {
    it('勝利条件の配列のコピーを返す', () => {
      const conditions = winEvaluator.getWinConditions();
      const originalLength = conditions.length;
      
      // 返された配列を変更
      conditions.push({
        id: 'fake',
        name: 'Fake',
        pattern: () => false,
        message: 'Fake'
      });
      
      // 元の配列は変更されていない
      expect(winEvaluator.getWinConditions()).toHaveLength(originalLength);
    });
  });

  describe('統合テスト', () => {
    it('evaluateResultとisWinningCombinationの結果が一致する', () => {
      const testCases = [
        // 勝利ケース
        [DEFAULT_SYMBOLS[0]!, DEFAULT_SYMBOLS[0]!, DEFAULT_SYMBOLS[0]!],
        [DEFAULT_SYMBOLS[1]!, DEFAULT_SYMBOLS[1]!, DEFAULT_SYMBOLS[1]!],
        // 敗北ケース
        [DEFAULT_SYMBOLS[0]!, DEFAULT_SYMBOLS[1]!, DEFAULT_SYMBOLS[2]!],
        [DEFAULT_SYMBOLS[0]!, DEFAULT_SYMBOLS[0]!, DEFAULT_SYMBOLS[1]!],
      ];

      testCases.forEach(symbols => {
        const evaluateResult = winEvaluator.evaluateResult(symbols);
        const isWinning = winEvaluator.isWinningCombination(symbols);
        
        expect(evaluateResult.isWin).toBe(isWinning);
      });
    });

    it('カスタム勝利条件が正しく動作する', () => {
      // チェリーが2つ以上で勝利という条件を追加
      const cherryCondition: WinCondition = {
        id: 'cherry_bonus',
        name: 'チェリーボーナス',
        pattern: (symbols) => symbols.filter(s => s.id === 'cherry').length >= 2,
        message: 'チェリーボーナス勝利！'
      };

      winEvaluator.addWinCondition(cherryCondition);

      const cherry = DEFAULT_SYMBOLS.find(s => s.id === 'cherry')!;
      const lemon = DEFAULT_SYMBOLS.find(s => s.id === 'lemon')!;
      
      // チェリー2つ + レモン1つ = 勝利
      const symbols = [cherry, cherry, lemon];
      const result = winEvaluator.evaluateResult(symbols);
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe('cherry_bonus');
      expect(result.message).toContain('チェリーボーナス');
    });
  });

  describe('プロパティベーステスト', () => {
    describe('プロパティ5: 勝敗判定ロジック', () => {
      /**
       * **検証対象: 要件 4.2, 4.3**
       * 
       * プロパティ: 任意の3つのシンボルのセットにおいて、すべてのシンボルが同一であれば
       * 勝利が宣言され、そうでなければ敗北が宣言されるべきです。
       * 
       * このテストは以下を検証します：
       * - 3つのリールすべてが同一のシンボルを表示した時、勝利結果を宣言する（要件 4.2）
       * - 3つのリールが異なるシンボルの組み合わせを表示した時、敗北結果を宣言する（要件 4.3）
       */
      it('すべてのシンボルが同一の場合は勝利、そうでなければ敗北を正しく判定する', () => {
        fc.assert(
          fc.property(
            // 3つのシンボルの組み合わせを生成
            fc.array(fc.constantFrom(...DEFAULT_SYMBOLS), { minLength: 3, maxLength: 3 }),
            (symbols) => {
              const result = winEvaluator.evaluateResult(symbols);
              const isWinning = winEvaluator.isWinningCombination(symbols);
              
              // evaluateResultとisWinningCombinationの結果が一致することを確認
              expect(result.isWin).toBe(isWinning);
              
              // 3つのシンボルがすべて同一かチェック
              const allSame = symbols[0]!.id === symbols[1]!.id && symbols[1]!.id === symbols[2]!.id;
              
              if (allSame) {
                // すべて同一の場合は勝利
                expect(result.isWin).toBe(true);
                expect(result.winType).toBe('three_of_a_kind');
                expect(result.message).toContain('おめでとうございます');
                expect(isWinning).toBe(true);
              } else {
                // 異なる組み合わせの場合は敗北
                expect(result.isWin).toBe(false);
                expect(result.winType).toBeUndefined();
                expect(result.message).toContain('残念');
                expect(isWinning).toBe(false);
                
                // 敗北メッセージにシンボルが含まれることを確認
                symbols.forEach(symbol => {
                  expect(result.message).toContain(symbol.displayValue);
                });
              }
              
              // 結果メッセージが空でないことを確認
              expect(result.message.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: 100 } // 設計ドキュメントで指定された100回の反復
        );
      });

      /**
       * **検証対象: 要件 4.2, 4.3**
       * 
       * プロパティ: 各シンボルタイプについて、3つ揃いの勝利条件が正しく動作することを検証
       */
      it('各シンボルタイプで3つ揃いの勝利条件が正しく動作する', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...DEFAULT_SYMBOLS),
            (symbol) => {
              // 同じシンボル3つの組み合わせ
              const threeOfAKind = [symbol, symbol, symbol];
              
              const result = winEvaluator.evaluateResult(threeOfAKind);
              const isWinning = winEvaluator.isWinningCombination(threeOfAKind);
              
              // 勝利判定
              expect(result.isWin).toBe(true);
              expect(result.winType).toBe('three_of_a_kind');
              expect(result.message).toContain('おめでとうございます');
              expect(isWinning).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.2, 4.3**
       * 
       * プロパティ: 2つ同じで1つ異なるパターンは常に敗北となることを検証
       */
      it('2つ同じで1つ異なるパターンは常に敗北となる', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...DEFAULT_SYMBOLS),
            fc.constantFrom(...DEFAULT_SYMBOLS),
            (symbol1, symbol2) => {
              // 異なるシンボルの場合のみテスト
              fc.pre(symbol1.id !== symbol2.id);
              
              // 2つ同じ、1つ異なるパターンを生成
              const patterns = [
                [symbol1, symbol1, symbol2], // AAB
                [symbol1, symbol2, symbol1], // ABA
                [symbol2, symbol1, symbol1], // BAA
              ];
              
              patterns.forEach(symbols => {
                const result = winEvaluator.evaluateResult(symbols);
                const isWinning = winEvaluator.isWinningCombination(symbols);
                
                // 敗北判定
                expect(result.isWin).toBe(false);
                expect(result.winType).toBeUndefined();
                expect(result.message).toContain('残念');
                expect(isWinning).toBe(false);
                
                // メッセージにシンボルが含まれることを確認
                symbols.forEach(symbol => {
                  expect(result.message).toContain(symbol.displayValue);
                });
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.2, 4.3**
       * 
       * プロパティ: すべて異なるシンボルのパターンは常に敗北となることを検証
       */
      it('すべて異なるシンボルのパターンは常に敗北となる', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...DEFAULT_SYMBOLS),
            fc.constantFrom(...DEFAULT_SYMBOLS),
            fc.constantFrom(...DEFAULT_SYMBOLS),
            (symbol1, symbol2, symbol3) => {
              // すべて異なるシンボルの場合のみテスト
              fc.pre(symbol1.id !== symbol2.id && symbol2.id !== symbol3.id && symbol1.id !== symbol3.id);
              
              const symbols = [symbol1, symbol2, symbol3];
              const result = winEvaluator.evaluateResult(symbols);
              const isWinning = winEvaluator.isWinningCombination(symbols);
              
              // 敗北判定
              expect(result.isWin).toBe(false);
              expect(result.winType).toBeUndefined();
              expect(result.message).toContain('残念');
              expect(isWinning).toBe(false);
              
              // メッセージにすべてのシンボルが含まれることを確認
              symbols.forEach(symbol => {
                expect(result.message).toContain(symbol.displayValue);
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.2, 4.3**
       * 
       * プロパティ: 勝敗判定の一貫性を検証（同じ入力に対して常に同じ結果）
       */
      it('同じ入力に対して常に一貫した結果を返す', () => {
        fc.assert(
          fc.property(
            fc.array(fc.constantFrom(...DEFAULT_SYMBOLS), { minLength: 3, maxLength: 3 }),
            (symbols) => {
              // 同じ入力で複数回評価
              const result1 = winEvaluator.evaluateResult(symbols);
              const result2 = winEvaluator.evaluateResult(symbols);
              const isWinning1 = winEvaluator.isWinningCombination(symbols);
              const isWinning2 = winEvaluator.isWinningCombination(symbols);
              
              // 結果の一貫性を確認
              expect(result1.isWin).toBe(result2.isWin);
              expect(result1.winType).toBe(result2.winType);
              expect(result1.message).toBe(result2.message);
              expect(isWinning1).toBe(isWinning2);
              
              // evaluateResultとisWinningCombinationの一貫性
              expect(result1.isWin).toBe(isWinning1);
              expect(result2.isWin).toBe(isWinning2);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});