/**
 * UserInterfaceクラスのユニットテスト
 * DOM操作、イベントハンドリング、表示機能をテストします
 * 
 * 要件: 5.1, 5.2, 2.2, 2.5
 */

import { UserInterface } from '../UserInterface';
import { Symbol, WinResult } from '../types';
import * as fc from 'fast-check';

describe('UserInterface', () => {
  let container: HTMLElement;
  let ui: UserInterface;

  beforeEach(() => {
    // テスト用のコンテナを作成
    container = document.createElement('div');
    container.id = 'slot-machine-container';
    document.body.appendChild(container);
    
    // UserInterfaceインスタンスを作成
    ui = new UserInterface('slot-machine-container');
  });

  afterEach(() => {
    // クリーンアップ
    ui.cleanup();
    document.body.removeChild(container);
  });

  describe('初期化', () => {
    test('コンテナが存在しない場合はエラーをスロー', () => {
      expect(() => {
        new UserInterface('non-existent-container');
      }).toThrow('Container element with id "non-existent-container" not found');
    });

    test('3つのリール要素を作成する', () => {
      const reels = container.querySelectorAll('.reel');
      expect(reels).toHaveLength(3);
    });

    test('各リールにdata-reel-index属性が設定されている', () => {
      const reels = container.querySelectorAll('.reel');
      reels.forEach((reel, index) => {
        expect(reel.getAttribute('data-reel-index')).toBe(index.toString());
      });
    });

    test('スピンボタンが作成される', () => {
      const button = container.querySelector('.spin-button');
      expect(button).not.toBeNull();
      expect(button?.textContent).toBe('スピン');
    });

    test('結果表示エリアが作成される', () => {
      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay).not.toBeNull();
    });

    test('リールコンテナが作成される', () => {
      const reelsContainer = container.querySelector('.reels-container');
      expect(reelsContainer).not.toBeNull();
    });
  });

  describe('displayReels()', () => {
    test('3つのシンボルを正しく表示する', () => {
      const symbols: Symbol[] = [
        { id: 'cherry', name: 'チェリー', displayValue: '🍒' },
        { id: 'lemon', name: 'レモン', displayValue: '🍋' },
        { id: 'orange', name: 'オレンジ', displayValue: '🍊' }
      ];

      ui.displayReels(symbols);

      const reels = container.querySelectorAll('.reel');
      reels.forEach((reel, index) => {
        const symbolDisplay = reel.querySelector('.symbol-display');
        expect(symbolDisplay?.textContent).toBe(symbols[index]?.displayValue);
        expect(symbolDisplay?.getAttribute('data-symbol-id')).toBe(symbols[index]?.id);
        expect(symbolDisplay?.getAttribute('title')).toBe(symbols[index]?.name);
      });
    });

    test('3つ以外のシンボル数の場合はエラーログを出力', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const symbols: Symbol[] = [
        { id: 'cherry', name: 'チェリー', displayValue: '🍒' }
      ];

      ui.displayReels(symbols);

      expect(consoleSpy).toHaveBeenCalledWith('Expected exactly 3 symbols, got:', 1);
      
      consoleSpy.mockRestore();
    });

    test('空の配列の場合はエラーログを出力', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ui.displayReels([]);

      expect(consoleSpy).toHaveBeenCalledWith('Expected exactly 3 symbols, got:', 0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('displaySpinButton()', () => {
    test('ボタンを有効化する - 要件 2.5', () => {
      ui.displaySpinButton(true);

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(button?.disabled).toBe(false);
      expect(button?.classList.contains('enabled')).toBe(true);
      expect(button?.classList.contains('disabled')).toBe(false);
    });

    test('ボタンを無効化する - 要件 2.2', () => {
      ui.displaySpinButton(false);

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(button?.disabled).toBe(true);
      expect(button?.classList.contains('disabled')).toBe(true);
      expect(button?.classList.contains('enabled')).toBe(false);
    });

    test('有効→無効→有効の切り替えが正しく動作する', () => {
      const button = container.querySelector('.spin-button') as HTMLButtonElement;

      ui.displaySpinButton(true);
      expect(button?.disabled).toBe(false);

      ui.displaySpinButton(false);
      expect(button?.disabled).toBe(true);

      ui.displaySpinButton(true);
      expect(button?.disabled).toBe(false);
    });
  });

  describe('displayResult()', () => {
    test('勝利結果を表示する - 要件 5.4', () => {
      const winResult: WinResult = {
        isWin: true,
        winType: 'three-of-a-kind',
        message: '勝利！おめでとうございます！'
      };

      ui.displayResult(winResult);

      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay?.textContent).toBe('勝利！おめでとうございます！');
      expect(resultDisplay?.classList.contains('win')).toBe(true);
      expect(resultDisplay?.classList.contains('lose')).toBe(false);
    });

    test('敗北結果を表示する - 要件 5.4', () => {
      const loseResult: WinResult = {
        isWin: false,
        message: '残念！もう一度挑戦してください。'
      };

      ui.displayResult(loseResult);

      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay?.textContent).toBe('残念！もう一度挑戦してください。');
      expect(resultDisplay?.classList.contains('lose')).toBe(true);
      expect(resultDisplay?.classList.contains('win')).toBe(false);
    });

    test('結果表示が可視化される', () => {
      const result: WinResult = {
        isWin: true,
        message: 'テスト'
      };

      ui.displayResult(result);

      const resultDisplay = container.querySelector('.result-display') as HTMLElement;
      expect(resultDisplay?.style.display).toBe('block');
    });
  });

  describe('startSpinAnimation()', () => {
    test('アニメーション開始時にスピンクラスを追加 - 要件 2.3', () => {
      ui.startSpinAnimation();

      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(true);
      });
    });

    test('アニメーション中はリールに🎰を表示', () => {
      ui.startSpinAnimation();

      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        const symbolDisplay = reel.querySelector('.symbol-display');
        expect(symbolDisplay?.textContent).toBe('🎰');
      });
    });

    test('結果表示をクリアする', () => {
      // まず結果を表示
      const result: WinResult = { isWin: true, message: 'テスト' };
      ui.displayResult(result);

      // アニメーションを開始
      ui.startSpinAnimation();

      const resultDisplay = container.querySelector('.result-display') as HTMLElement;
      expect(resultDisplay?.textContent).toBe('');
      expect(resultDisplay?.style.display).toBe('none');
    });

    test('Promiseを返す', () => {
      const promise = ui.startSpinAnimation();
      expect(promise).toBeInstanceOf(Promise);
    });

    test('約1秒後にPromiseが解決される', async () => {
      const startTime = Date.now();
      await ui.startSpinAnimation();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1秒前後（900ms〜1100ms）であることを確認
      expect(duration).toBeGreaterThanOrEqual(900);
      expect(duration).toBeLessThan(1200);
    });
  });

  describe('stopSpinAnimation()', () => {
    test('スピンクラスを削除 - 要件 2.4', () => {
      // まずアニメーションを開始
      ui.startSpinAnimation();

      // アニメーションを停止
      ui.stopSpinAnimation();

      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(false);
      });
    });

    test('アニメーション開始→停止のサイクルが正しく動作', () => {
      const reels = container.querySelectorAll('.reel');

      // 初期状態
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(false);
      });

      // アニメーション開始
      ui.startSpinAnimation();
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(true);
      });

      // アニメーション停止
      ui.stopSpinAnimation();
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(false);
      });
    });
  });

  describe('onSpinButtonClick()', () => {
    test('コールバックが登録される', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      button.click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('アニメーション中はコールバックが呼ばれない', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      // アニメーションを開始
      ui.startSpinAnimation();

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      button.click();

      expect(callback).not.toHaveBeenCalled();
    });

    test('アニメーション停止後はコールバックが呼ばれる', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      // アニメーションを開始して停止
      ui.startSpinAnimation();
      ui.stopSpinAnimation();

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      button.click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('複数回クリックすると複数回コールバックが呼ばれる', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      button.click();
      button.click();
      button.click();

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('統合テスト', () => {
    test('完全なスピンサイクル: ボタンクリック→アニメーション→結果表示', async () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      // 1. ボタンをクリック
      const button = container.querySelector('.spin-button') as HTMLButtonElement;
      button.click();
      expect(callback).toHaveBeenCalledTimes(1);

      // 2. ボタンを無効化
      ui.displaySpinButton(false);
      expect(button.disabled).toBe(true);

      // 3. アニメーション開始
      const animationPromise = ui.startSpinAnimation();
      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(true);
      });

      // 4. アニメーション完了を待機
      await animationPromise;

      // 5. アニメーション停止
      ui.stopSpinAnimation();
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(false);
      });

      // 6. シンボルを表示
      const symbols: Symbol[] = [
        { id: 'cherry', name: 'チェリー', displayValue: '🍒' },
        { id: 'cherry', name: 'チェリー', displayValue: '🍒' },
        { id: 'cherry', name: 'チェリー', displayValue: '🍒' }
      ];
      ui.displayReels(symbols);

      // 7. 結果を表示
      const result: WinResult = {
        isWin: true,
        winType: 'three-of-a-kind',
        message: '勝利！'
      };
      ui.displayResult(result);

      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay?.textContent).toBe('勝利！');
      expect(resultDisplay?.classList.contains('win')).toBe(true);

      // 8. ボタンを再有効化
      ui.displaySpinButton(true);
      expect(button.disabled).toBe(false);
    });

    test('UI要素の配置: リール→ボタン→結果表示の順序', () => {
      const children = Array.from(container.children);
      
      expect(children[0]?.classList.contains('reels-container')).toBe(true);
      expect(children[1]?.classList.contains('spin-button')).toBe(true);
      expect(children[2]?.classList.contains('result-display')).toBe(true);
    });
  });

  describe('エッジケース', () => {
    test('cleanup()後は要素がクリアされる', () => {
      ui.cleanup();

      expect(container.innerHTML).toBe('');
    });

    test('cleanup()後のコールバック呼び出しは無視される', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);
      
      ui.cleanup();

      // cleanup後はボタンが存在しないため、クリックできない
      const button = container.querySelector('.spin-button');
      expect(button).toBeNull();
    });
  });

  describe('アニメーション設定機能', () => {
    test('setAnimationDuration()でアニメーション時間を設定できる', () => {
      ui.setAnimationDuration(2000);
      expect(ui.getAnimationDuration()).toBe(2000);
    });

    test('デフォルトのアニメーション時間は1000ms', () => {
      expect(ui.getAnimationDuration()).toBe(1000);
    });

    test('負の値を設定すると警告を出してデフォルト値を維持', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      ui.setAnimationDuration(1500);
      expect(ui.getAnimationDuration()).toBe(1500);
      
      ui.setAnimationDuration(-100);
      expect(ui.getAnimationDuration()).toBe(1500); // 変更されない
      expect(warnSpy).toHaveBeenCalled();
      
      warnSpy.mockRestore();
    });

    test('isSpinning()でアニメーション状態を確認できる', () => {
      expect(ui.isSpinning()).toBe(false);
      
      ui.startSpinAnimation();
      expect(ui.isSpinning()).toBe(true);
      
      ui.stopSpinAnimation();
      expect(ui.isSpinning()).toBe(false);
    });
  });

  describe('カスタムアニメーション時間', () => {
    test('カスタム時間でアニメーションが完了する', async () => {
      const customDuration = 500;
      const startTime = Date.now();
      
      await ui.startSpinAnimation({ duration: customDuration });
      
      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      
      // 500ms前後（400ms〜600ms）であることを確認
      expect(actualDuration).toBeGreaterThanOrEqual(400);
      expect(actualDuration).toBeLessThan(700);
    });

    test('duration: 0でも正常に動作する', async () => {
      const startTime = Date.now();
      await ui.startSpinAnimation({ duration: 0 });
      const endTime = Date.now();
      
      // ほぼ即座に完了
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('アニメーション完了コールバック', () => {
    test('onCompleteコールバックがアニメーション完了時に呼ばれる', async () => {
      const onComplete = jest.fn();
      
      await ui.startSpinAnimation({ 
        duration: 100,
        onComplete 
      });
      
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test('onCompleteコールバックなしでも正常に動作する', async () => {
      await expect(
        ui.startSpinAnimation({ duration: 100 })
      ).resolves.toBeUndefined();
    });

    test('複数回のアニメーションで異なるコールバックを使用できる', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      await ui.startSpinAnimation({ duration: 50, onComplete: callback1 });
      ui.stopSpinAnimation();
      
      await ui.startSpinAnimation({ duration: 50, onComplete: callback2 });
      ui.stopSpinAnimation();
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('stopSpinAnimation()を呼ぶとアニメーションが即座に停止する', () => {
      ui.startSpinAnimation({ 
        duration: 1000,
        onComplete: jest.fn()
      });
      
      expect(ui.isSpinning()).toBe(true);
      
      // アニメーション完了前に停止
      ui.stopSpinAnimation();
      
      // 即座に停止状態になる
      expect(ui.isSpinning()).toBe(false);
      
      // リールからspinningクラスが削除される
      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(false);
      });
    });
  });

  describe('段階的リール停止機能', () => {
    test('staggeredStop: trueでリールが順番に停止する', async () => {
      const startTime = Date.now();
      
      await ui.startSpinAnimation({ 
        duration: 100,
        staggeredStop: true 
      });
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // 基本時間(100ms) + 段階的停止時間(3リール × 200ms = 600ms) = 約700ms
      // 実際には多少の誤差があるため、範囲で確認
      expect(totalDuration).toBeGreaterThanOrEqual(600);
      expect(totalDuration).toBeLessThan(900);
    });

    test('staggeredStop: falseまたは未指定で即座に停止する', async () => {
      const startTime = Date.now();
      
      await ui.startSpinAnimation({ 
        duration: 100,
        staggeredStop: false 
      });
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // 基本時間のみ（100ms前後）
      expect(totalDuration).toBeGreaterThanOrEqual(50);
      expect(totalDuration).toBeLessThan(300);
    });

    test('段階的停止でもonCompleteコールバックが呼ばれる', async () => {
      const onComplete = jest.fn();
      
      await ui.startSpinAnimation({ 
        duration: 50,
        staggeredStop: true,
        onComplete 
      });
      
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('プロパティベーステスト', () => {
    describe('プロパティ6: 結果フィードバック', () => {
      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: 任意の完了したスピンにおいて、勝敗評価直後に適切な視覚的フィードバック
       * （勝利メッセージまたは敗北処理）が表示されるべきです。
       * 
       * このテストは以下を検証します：
       * - 勝利条件が満たされた時、明確な勝利メッセージを表示する（要件 4.4）
       * - 敗北が発生した時、適切なフィードバックを表示する（要件 4.5）
       * - ゲーム結果表示時、勝敗について即座に視覚的フィードバックを提供する（要件 5.4）
       */
      it('任意の勝敗結果に対して適切な視覚的フィードバックを即座に表示する', () => {
        fc.assert(
          fc.property(
            // 勝敗結果を生成
            fc.boolean(),
            fc.string({ minLength: 1, maxLength: 100 }),
            (isWin, message) => {
              const result: WinResult = {
                isWin,
                message,
                ...(isWin && { winType: 'three_of_a_kind' })
              };
              
              // 結果を表示
              ui.displayResult(result);

              // 結果表示エリアを取得
              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              
              // 結果表示エリアが存在することを確認
              expect(resultDisplay).not.toBeNull();
              
              // メッセージが表示されていることを確認（要件 4.4, 4.5）
              expect(resultDisplay.textContent).toBe(result.message);
              
              // 視覚的フィードバックが提供されていることを確認（要件 5.4）
              expect(resultDisplay.style.display).toBe('block');
              
              // 勝敗に応じた適切なクラスが設定されていることを確認
              if (result.isWin) {
                // 勝利の場合、winクラスが設定されている
                expect(resultDisplay.classList.contains('win')).toBe(true);
                expect(resultDisplay.classList.contains('lose')).toBe(false);
              } else {
                // 敗北の場合、loseクラスが設定されている
                expect(resultDisplay.classList.contains('lose')).toBe(true);
                expect(resultDisplay.classList.contains('win')).toBe(false);
              }
            }
          ),
          { numRuns: 100 } // 設計ドキュメントで指定された100回の反復
        );
      });

      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: 勝利結果の表示は常に明確な勝利メッセージと適切なスタイリングを含むべきです。
       */
      it('勝利結果は常に明確な勝利メッセージと適切なスタイリングを表示する', () => {
        fc.assert(
          fc.property(
            // 勝利メッセージを生成
            fc.string({ minLength: 1, maxLength: 100 }),
            (message) => {
              const winResult: WinResult = {
                isWin: true,
                winType: 'three_of_a_kind',
                message
              };

              ui.displayResult(winResult);

              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              
              // 勝利メッセージが表示されている（要件 4.4）
              expect(resultDisplay.textContent).toBe(message);
              
              // 視覚的フィードバックが即座に提供されている（要件 5.4）
              expect(resultDisplay.style.display).toBe('block');
              
              // 勝利スタイルが適用されている
              expect(resultDisplay.classList.contains('win')).toBe(true);
              expect(resultDisplay.classList.contains('lose')).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: 敗北結果の表示は常に適切なフィードバックメッセージとスタイリングを含むべきです。
       */
      it('敗北結果は常に適切なフィードバックメッセージとスタイリングを表示する', () => {
        fc.assert(
          fc.property(
            // 敗北メッセージを生成
            fc.string({ minLength: 1, maxLength: 100 }),
            (message) => {
              const loseResult: WinResult = {
                isWin: false,
                message
              };

              ui.displayResult(loseResult);

              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              
              // 敗北フィードバックが表示されている（要件 4.5）
              expect(resultDisplay.textContent).toBe(message);
              
              // 視覚的フィードバックが即座に提供されている（要件 5.4）
              expect(resultDisplay.style.display).toBe('block');
              
              // 敗北スタイルが適用されている
              expect(resultDisplay.classList.contains('lose')).toBe(true);
              expect(resultDisplay.classList.contains('win')).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: 結果表示の一貫性 - 同じ結果を複数回表示しても一貫した動作をするべきです。
       */
      it('同じ結果を複数回表示しても一貫した視覚的フィードバックを提供する', () => {
        fc.assert(
          fc.property(
            fc.boolean(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.integer({ min: 2, max: 5 }), // 表示回数
            (isWin, message, numDisplays) => {
              const result: WinResult = {
                isWin,
                message,
                ...(isWin && { winType: 'three_of_a_kind' })
              };
              
              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              
              for (let i = 0; i < numDisplays; i++) {
                ui.displayResult(result);
                
                // 各表示で一貫した動作を確認
                expect(resultDisplay.textContent).toBe(result.message);
                expect(resultDisplay.style.display).toBe('block');
                
                if (result.isWin) {
                  expect(resultDisplay.classList.contains('win')).toBe(true);
                  expect(resultDisplay.classList.contains('lose')).toBe(false);
                } else {
                  expect(resultDisplay.classList.contains('lose')).toBe(true);
                  expect(resultDisplay.classList.contains('win')).toBe(false);
                }
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: 結果表示の切り替え - 勝利と敗北の結果を交互に表示しても正しく動作するべきです。
       */
      it('勝利と敗北の結果を交互に表示しても正しく視覚的フィードバックを切り替える', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.tuple(
                fc.boolean(),
                fc.string({ minLength: 1, maxLength: 100 })
              ),
              { minLength: 2, maxLength: 10 }
            ),
            (resultPairs) => {
              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              
              resultPairs.forEach(([isWin, message]) => {
                const result: WinResult = {
                  isWin,
                  message,
                  ...(isWin && { winType: 'three_of_a_kind' })
                };
                
                ui.displayResult(result);
                
                // 各結果で正しいフィードバックが表示されることを確認
                expect(resultDisplay.textContent).toBe(result.message);
                expect(resultDisplay.style.display).toBe('block');
                
                // 前の結果のスタイルが正しくクリアされていることを確認
                if (result.isWin) {
                  expect(resultDisplay.classList.contains('win')).toBe(true);
                  expect(resultDisplay.classList.contains('lose')).toBe(false);
                } else {
                  expect(resultDisplay.classList.contains('lose')).toBe(true);
                  expect(resultDisplay.classList.contains('win')).toBe(false);
                }
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * **検証対象: 要件 4.4, 4.5, 5.4**
       * 
       * プロパティ: スピンアニメーション後の結果表示 - アニメーション完了後に結果を表示しても
       * 正しく動作するべきです。
       */
      it('スピンアニメーション完了後に結果を表示しても正しく視覚的フィードバックを提供する', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.boolean(),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (isWin, message) => {
              const result: WinResult = {
                isWin,
                message,
                ...(isWin && { winType: 'three_of_a_kind' })
              };
              
              // アニメーションを開始
              const animationPromise = ui.startSpinAnimation({ duration: 50 });
              
              // アニメーション中は結果表示がクリアされている
              const resultDisplay = container.querySelector('.result-display') as HTMLElement;
              expect(resultDisplay.textContent).toBe('');
              expect(resultDisplay.style.display).toBe('none');
              
              // アニメーション完了を待機
              await animationPromise;
              
              // アニメーション停止
              ui.stopSpinAnimation();
              
              // 結果を表示
              ui.displayResult(result);
              
              // 結果が正しく表示されることを確認（要件 5.4）
              expect(resultDisplay.textContent).toBe(result.message);
              expect(resultDisplay.style.display).toBe('block');
              
              if (result.isWin) {
                expect(resultDisplay.classList.contains('win')).toBe(true);
                expect(resultDisplay.classList.contains('lose')).toBe(false);
              } else {
                expect(resultDisplay.classList.contains('lose')).toBe(true);
                expect(resultDisplay.classList.contains('win')).toBe(false);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
