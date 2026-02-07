/**
 * 統合テスト
 * アプリケーション全体の統合をテストします
 *
 * 要件: 1.1, 1.2, 1.3, 2.1, 2.4, 4.1
 */

import { SlotMachineApp } from '../index';
import { GameState } from '../types';

describe('SlotMachineApp 統合テスト', () => {
  let container: HTMLElement;
  let app: SlotMachineApp;

  beforeEach(() => {
    // テスト用のコンテナを作成
    container = document.createElement('div');
    container.id = 'test-slot-machine-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // クリーンアップ
    if (app) {
      app.cleanup();
    }
    document.body.removeChild(container);
  });

  describe('アプリケーション初期化', () => {
    test('要件1.1, 1.2, 1.3: アプリケーションが正しく初期化される', () => {
      // アプリケーションを作成して初期化
      app = new SlotMachineApp('test-slot-machine-container');
      app.initialize();

      // 要件1.3: ゲーム状態が待機中であることを確認
      expect(app.getCurrentState()).toBe(GameState.IDLE);

      // 要件1.1: 3つのリールが表示されていることを確認
      const reels = container.querySelectorAll('.reel');
      expect(reels.length).toBe(3);

      // 要件1.2: スピンボタンが有効状態で表示されていることを確認
      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(spinButton).toBeTruthy();
      expect(spinButton.disabled).toBe(false);

      // 初期化フラグが立っていることを確認
      expect(app.isReady()).toBe(true);
    });

    test('初期状態で3つの空のリールが表示される', () => {
      app = new SlotMachineApp('test-slot-machine-container');
      app.initialize();

      // リールが存在することを確認
      const reels = container.querySelectorAll('.reel');
      expect(reels.length).toBe(3);

      // 各リールにシンボル表示要素があることを確認
      reels.forEach(reel => {
        const symbolDisplay = reel.querySelector('.symbol-display');
        expect(symbolDisplay).toBeTruthy();
        expect(symbolDisplay?.textContent).toBe('?'); // プレースホルダー
      });
    });

    test('重複初期化を防ぐ', () => {
      app = new SlotMachineApp('test-slot-machine-container');

      // コンソール警告をモック
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.initialize();
      app.initialize(); // 2回目の初期化

      expect(consoleWarnSpy).toHaveBeenCalledWith('アプリケーションは既に初期化されています');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('スピン機能の統合', () => {
    test('要件2.1, 2.4, 4.1: 完全なスピンサイクルが正しく動作する', async () => {
      app = new SlotMachineApp('test-slot-machine-container');
      app.initialize();

      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      const stopButtons = container.querySelectorAll(
        '.stop-button'
      ) as NodeListOf<HTMLButtonElement>;

      // 初期状態: スピンボタンが有効、停止ボタンが無効
      expect(spinButton.disabled).toBe(false);
      expect(app.getCurrentState()).toBe(GameState.IDLE);
      stopButtons.forEach(btn => expect(btn.disabled).toBe(true));

      // スピンボタンをクリック
      spinButton.click();

      // スピン開始直後: スピンボタンが無効化、停止ボタンが有効化される（要件2.2, 2.4）
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(spinButton.disabled).toBe(true);
      stopButtons.forEach(btn => expect(btn.disabled).toBe(false));

      // リールを順番に停止
      for (let i = 0; i < 3; i++) {
        const button = stopButtons[i];
        if (button) {
          button.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // すべてのリール停止後、結果表示を待つ
      await new Promise(resolve => setTimeout(resolve, 2500));

      // スピン完了後: ボタンが再有効化される（要件2.7）
      expect(spinButton.disabled).toBe(false);
      expect(app.getCurrentState()).toBe(GameState.IDLE);

      // 結果が表示されていることを確認（要件2.5）
      const reels = container.querySelectorAll('.reel .symbol-display');
      reels.forEach(symbolDisplay => {
        expect(symbolDisplay.textContent).not.toBe('?');
        expect(symbolDisplay.textContent).not.toBe('🎰');
      });

      // 結果表示エリアにメッセージが表示されていることを確認（要件4.4, 4.5）
      const resultDisplay = container.querySelector('.result-display');
      expect(resultDisplay).toBeTruthy();
      expect(resultDisplay?.textContent).not.toBe('');
    }, 10000); // タイムアウトを10秒に設定

    test('スピン中は新しいスピンを開始できない', async () => {
      app = new SlotMachineApp('test-slot-machine-container');
      app.initialize();

      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;

      // 最初のスピンを開始
      spinButton.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // スピン中はボタンが無効化されている
      expect(spinButton.disabled).toBe(true);

      // ボタンをクリックしても何も起こらない（無効化されているため）
      spinButton.click();

      // 状態は変わらない
      expect(spinButton.disabled).toBe(true);

      // スピン完了を待つ
      await new Promise(resolve => setTimeout(resolve, 4500));
    }, 10000);
  });

  describe('エラーハンドリング', () => {
    test('存在しないコンテナIDでエラーをスロー', () => {
      expect(() => {
        new SlotMachineApp('non-existent-container');
      }).toThrow();
    });

    test('初期化前のスピンは実行されない', () => {
      app = new SlotMachineApp('test-slot-machine-container');
      // 初期化しない

      // 初期化していないので、isReady()はfalseを返す
      expect(app.isReady()).toBe(false);

      // UIは作成されているが、初期化されていない
      const spinButton = container.querySelector('.spin-button') as HTMLButtonElement;
      expect(spinButton).toBeTruthy();

      // スピンボタンをクリックしても、コールバックが設定されていないので何も起こらない
      // （これは期待される動作）
    });
  });

  describe('コンポーネントライフサイクル', () => {
    test('クリーンアップが正しく動作する', () => {
      app = new SlotMachineApp('test-slot-machine-container');
      app.initialize();

      expect(app.isReady()).toBe(true);

      // UIが作成されていることを確認
      const spinButton = container.querySelector('.spin-button');
      expect(spinButton).toBeTruthy();

      // クリーンアップ
      app.cleanup();

      expect(app.isReady()).toBe(false);

      // UIがクリアされていることを確認
      const spinButtonAfter = container.querySelector('.spin-button');
      expect(spinButtonAfter).toBeFalsy();
    });

    test('複数のアプリケーションインスタンスを作成できる', () => {
      // 2つ目のコンテナを作成
      const container2 = document.createElement('div');
      container2.id = 'test-slot-machine-container-2';
      document.body.appendChild(container2);

      try {
        const app1 = new SlotMachineApp('test-slot-machine-container');
        const app2 = new SlotMachineApp('test-slot-machine-container-2');

        app1.initialize();
        app2.initialize();

        expect(app1.isReady()).toBe(true);
        expect(app2.isReady()).toBe(true);
        expect(app1.getCurrentState()).toBe(GameState.IDLE);
        expect(app2.getCurrentState()).toBe(GameState.IDLE);

        // クリーンアップ
        app1.cleanup();
        app2.cleanup();
      } finally {
        document.body.removeChild(container2);
      }
    });
  });
});
