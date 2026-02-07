/**
 * UserInterfaceクラスのユニットテスト
 * DOM操作、イベントハンドリング、表示機能をテストします
 * 
 * 要件: 5.1, 5.2, 5.3, 2.2, 2.5
 */

import { UserInterface } from '../UserInterface';
import { Symbol, WinResult } from '../types';

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
      const spinButton = container.querySelector('.spin-button');
      expect(spinButton).not.toBeNull();
      expect(spinButton?.textContent).toBe('スピン');
    });

    test('3つの停止ボタンが作成される', () => {
      const stopButtons = container.querySelectorAll('.stop-button');
      expect(stopButtons).toHaveLength(3);
    });

    test('結果表示エリアが作成される', () => {
      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay).not.toBeNull();
    });
  });

  describe('displayReels', () => {
    test('シンボルを正しく表示する', () => {
      const symbols: Symbol[] = [
        { id: 'cherry', name: 'Cherry', displayValue: '🍒' },
        { id: 'lemon', name: 'Lemon', displayValue: '🍋' },
        { id: 'orange', name: 'Orange', displayValue: '🍊' }
      ];

      ui.displayReels(symbols);

      const symbolDisplays = container.querySelectorAll('.symbol-display');
      expect(symbolDisplays[0]!.textContent).toBe('🍒');
      expect(symbolDisplays[1]!.textContent).toBe('🍋');
      expect(symbolDisplays[2]!.textContent).toBe('🍊');
    });

    test('nullの場合は回転中アイコンを表示する', () => {
      const symbols: (Symbol | null)[] = [
        { id: 'cherry', name: 'Cherry', displayValue: '🍒' },
        null,
        { id: 'orange', name: 'Orange', displayValue: '🍊' }
      ];

      ui.displayReels(symbols);

      const symbolDisplays = container.querySelectorAll('.symbol-display');
      expect(symbolDisplays[0]!.textContent).toBe('🍒');
      expect(symbolDisplays[1]!.textContent).toBe('🎰');
      expect(symbolDisplays[2]!.textContent).toBe('🍊');
    });

    test('3つ以外のシンボル数の場合はエラーログを出力', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ui.displayReels([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Expected exactly 3 symbols, got:', 0);
      consoleSpy.mockRestore();
    });
  });

  describe('displaySpinButton', () => {
    test('ボタンを有効化できる', () => {
      ui.displaySpinButton(true);
      
      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(spinButton.disabled).toBe(false);
      expect(spinButton.classList.contains('enabled')).toBe(true);
    });

    test('ボタンを無効化できる', () => {
      ui.displaySpinButton(false);
      
      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(spinButton.disabled).toBe(true);
      expect(spinButton.classList.contains('disabled')).toBe(true);
    });
  });

  describe('displayStopButtons', () => {
    test('停止ボタンの状態を設定できる', () => {
      ui.displayStopButtons([true, false, true]);
      
      const stopButtons = container.querySelectorAll('.stop-button') as NodeListOf<HTMLButtonElement>;
      expect(stopButtons[0]!.disabled).toBe(false);
      expect(stopButtons[1]!.disabled).toBe(true);
      expect(stopButtons[2]!.disabled).toBe(false);
    });

    test('すべての停止ボタンを有効化できる', () => {
      ui.displayStopButtons([true, true, true]);
      
      const stopButtons = container.querySelectorAll('.stop-button') as NodeListOf<HTMLButtonElement>;
      stopButtons.forEach(button => {
        expect(button.disabled).toBe(false);
      });
    });

    test('すべての停止ボタンを無効化できる', () => {
      ui.displayStopButtons([false, false, false]);
      
      const stopButtons = container.querySelectorAll('.stop-button') as NodeListOf<HTMLButtonElement>;
      stopButtons.forEach(button => {
        expect(button.disabled).toBe(true);
      });
    });
  });

  describe('displayResult', () => {
    test('勝利結果を表示する', () => {
      const winResult: WinResult = {
        isWin: true,
        winType: 'three_of_a_kind',
        message: '🎉 おめでとうございます！3つ揃いました！'
      };

      ui.displayResult(winResult);

      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay?.textContent).toBe('🎉 おめでとうございます！3つ揃いました！');
      expect(resultDisplay?.classList.contains('win')).toBe(true);
    });

    test('敗北結果を表示する', () => {
      const loseResult: WinResult = {
        isWin: false,
        message: '残念！もう一度挑戦してください。'
      };

      ui.displayResult(loseResult);

      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay?.textContent).toBe('残念！もう一度挑戦してください。');
      expect(resultDisplay?.classList.contains('lose')).toBe(true);
    });
  });

  describe('startSpinAnimation', () => {
    test('すべてのリールにspinningクラスを追加する', () => {
      ui.startSpinAnimation();

      const reels = container.querySelectorAll('.reel');
      reels.forEach(reel => {
        expect(reel.classList.contains('spinning')).toBe(true);
      });
    });

    test('特定のリールのみにspinningクラスを追加できる', () => {
      ui.startSpinAnimation(1);

      const reels = container.querySelectorAll('.reel');
      expect(reels[0]!.classList.contains('spinning')).toBe(false);
      expect(reels[1]!.classList.contains('spinning')).toBe(true);
      expect(reels[2]!.classList.contains('spinning')).toBe(false);
    });
  });

  describe('stopSpinAnimation', () => {
    test('指定されたリールのspinningクラスを削除する', async () => {
      ui.startSpinAnimation();
      ui.stopSpinAnimation(0);

      // 停止エフェクトの時間を待つ
      await new Promise(resolve => setTimeout(resolve, 400));

      const reels = container.querySelectorAll('.reel');
      expect(reels[0]!.classList.contains('spinning')).toBe(false);
      expect(reels[1]!.classList.contains('spinning')).toBe(true);
      expect(reels[2]!.classList.contains('spinning')).toBe(true);
    });
  });

  describe('イベントハンドリング', () => {
    test('スピンボタンのクリックイベントが発火する', () => {
      const callback = jest.fn();
      ui.onSpinButtonClick(callback);

      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      spinButton.click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('停止ボタンのクリックイベントが発火する', () => {
      const callback = jest.fn();
      ui.onStopButtonClick(callback);

      // 停止ボタンを有効化
      ui.displayStopButtons([true, true, true]);

      const stopButtons = container.querySelectorAll('.stop-button') as NodeListOf<HTMLButtonElement>;
      stopButtons[0]!.click();
      stopButtons[1]!.click();
      stopButtons[2]!.click();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 0);
      expect(callback).toHaveBeenNthCalledWith(2, 1);
      expect(callback).toHaveBeenNthCalledWith(3, 2);
    });
  });
});
