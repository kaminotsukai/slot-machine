import { UserInterface as IUserInterface } from './interfaces/UserInterface';
import { Symbol, WinResult } from './types';

/**
 * UserInterfaceクラス
 * すべての視覚要素とユーザーインタラクションを処理します
 * 
 * 要件: 5.1, 5.2, 2.2, 2.5
 */
export class UserInterface implements IUserInterface {
  private reelElements: HTMLElement[] = [];
  private spinButton: HTMLButtonElement | null = null;
  private resultDisplay: HTMLElement | null = null;
  private container: HTMLElement;
  private spinCallback: (() => void) | null = null;
  private isAnimating: boolean = false;
  private animationDuration: number = 1000; // デフォルト1秒
  private animationCompletionCallback: (() => void) | null = null;
  private animationTimeoutId: number | null = null;

  /**
   * UserInterfaceのコンストラクタ
   * @param containerId - スロットマシンUIを配置するコンテナ要素のID
   */
  constructor(containerId: string = 'slot-machine-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = container;
    this.initializeUI();
  }

  /**
   * UIの初期化
   * 3つのリール、スピンボタン、結果表示エリアを作成します
   */
  private initializeUI(): void {
    // コンテナをクリア
    this.container.innerHTML = '';
    this.container.className = 'slot-machine';

    // リールコンテナを作成
    const reelsContainer = document.createElement('div');
    reelsContainer.className = 'reels-container';

    // 3つのリールを作成
    for (let i = 0; i < 3; i++) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.setAttribute('data-reel-index', i.toString());
      
      // リールの初期表示（空）
      const symbolDisplay = document.createElement('div');
      symbolDisplay.className = 'symbol-display';
      symbolDisplay.textContent = '?';
      
      reel.appendChild(symbolDisplay);
      reelsContainer.appendChild(reel);
      this.reelElements.push(reel);
    }

    this.container.appendChild(reelsContainer);

    // スピンボタンを作成
    this.spinButton = document.createElement('button');
    this.spinButton.className = 'spin-button';
    this.spinButton.textContent = 'スピン';
    this.spinButton.type = 'button';
    this.spinButton.addEventListener('click', () => this.handleSpinClick());
    this.container.appendChild(this.spinButton);

    // 結果表示エリアを作成
    this.resultDisplay = document.createElement('div');
    this.resultDisplay.className = 'result-display';
    this.resultDisplay.textContent = '';
    this.container.appendChild(this.resultDisplay);
  }

  /**
   * スピンボタンのクリックを処理
   */
  private handleSpinClick(): void {
    if (this.spinCallback && !this.isAnimating) {
      this.spinCallback();
    }
  }

  /**
   * リールにシンボルを表示
   * @param symbols - 表示するシンボルの配列（3つ）
   * 
   * 要件: 5.1 - リールを目立つように表示
   */
  displayReels(symbols: Symbol[]): void {
    if (symbols.length !== 3) {
      console.error('Expected exactly 3 symbols, got:', symbols.length);
      return;
    }

    symbols.forEach((symbol, index) => {
      const reel = this.reelElements[index];
      if (reel) {
        const symbolDisplay = reel.querySelector('.symbol-display');
        if (symbolDisplay) {
          symbolDisplay.textContent = symbol.displayValue;
          symbolDisplay.setAttribute('data-symbol-id', symbol.id);
          symbolDisplay.setAttribute('title', symbol.name);
        }
      }
    });
  }

  /**
   * スピンボタンの状態を設定
   * @param enabled - ボタンを有効にするかどうか
   * 
   * 要件: 2.2 - スピン中はボタンを無効化
   * 要件: 2.5 - スピン完了後にボタンを再有効化
   * 要件: 5.2 - スピンボタンをアクセスしやすい位置に配置
   */
  displaySpinButton(enabled: boolean): void {
    if (this.spinButton) {
      this.spinButton.disabled = !enabled;
      
      if (enabled) {
        this.spinButton.classList.remove('disabled');
        this.spinButton.classList.add('enabled');
      } else {
        this.spinButton.classList.remove('enabled');
        this.spinButton.classList.add('disabled');
      }
    }
  }

  /**
   * ゲーム結果を表示
   * @param result - 表示する勝敗結果
   * 
   * 要件: 5.4 - 勝敗について即座に視覚的フィードバックを提供
   */
  displayResult(result: WinResult): void {
    if (this.resultDisplay) {
      this.resultDisplay.textContent = result.message;
      
      // 勝敗に応じてクラスを設定
      this.resultDisplay.classList.remove('win', 'lose');
      if (result.isWin) {
        this.resultDisplay.classList.add('win');
      } else {
        this.resultDisplay.classList.add('lose');
      }
      
      // 結果を表示
      this.resultDisplay.style.display = 'block';
    }
  }

  /**
   * スピンアニメーションを開始
   * @param options オプション設定
   * @param options.duration アニメーション時間（ミリ秒）。デフォルトは1000ms
   * @param options.onComplete アニメーション完了時のコールバック関数
   * @param options.staggeredStop リールを順番に停止させるかどうか。デフォルトはfalse
   * @returns アニメーション完了を示すPromise
   * 
   * 要件: 2.3 - 回転動作を示す視覚的フィードバックを表示
   */
  async startSpinAnimation(options?: {
    duration?: number;
    onComplete?: () => void;
    staggeredStop?: boolean;
  }): Promise<void> {
    this.isAnimating = true;
    
    // オプションから設定を取得
    const duration = options?.duration ?? this.animationDuration;
    this.animationCompletionCallback = options?.onComplete ?? null;
    const staggeredStop = options?.staggeredStop ?? false;
    
    // すべてのリールにスピンアニメーションクラスを追加
    this.reelElements.forEach(reel => {
      reel.classList.add('spinning');
      const symbolDisplay = reel.querySelector('.symbol-display');
      if (symbolDisplay) {
        symbolDisplay.textContent = '🎰';
      }
    });

    // 結果表示をクリア
    if (this.resultDisplay) {
      this.resultDisplay.textContent = '';
      this.resultDisplay.style.display = 'none';
    }

    // アニメーション時間を待機（実際のアニメーションはCSSで制御）
    return new Promise(resolve => {
      this.animationTimeoutId = window.setTimeout(() => {
        this.animationTimeoutId = null;
        
        // 段階的停止が有効な場合、リールを順番に停止
        if (staggeredStop) {
          this.stopReelsStaggered().then(() => {
            // 完了コールバックを実行
            if (this.animationCompletionCallback) {
              this.animationCompletionCallback();
            }
            resolve();
          });
        } else {
          // 完了コールバックを実行
          if (this.animationCompletionCallback) {
            this.animationCompletionCallback();
          }
          resolve();
        }
      }, duration);
    });
  }

  /**
   * スピンアニメーションを停止
   * 
   * 要件: 2.4 - すべてのリールを停止させ、最終シンボルを表示
   */
  stopSpinAnimation(): void {
    this.isAnimating = false;
    
    // 実行中のタイムアウトをキャンセル
    if (this.animationTimeoutId !== null) {
      window.clearTimeout(this.animationTimeoutId);
      this.animationTimeoutId = null;
    }
    
    // すべてのリールからスピンアニメーションクラスを削除
    this.reelElements.forEach(reel => {
      reel.classList.remove('spinning');
    });
    
    // 完了コールバックをクリア
    this.animationCompletionCallback = null;
  }

  /**
   * リールを段階的に停止させる（プライベートメソッド）
   * より本物のスロットマシンのような体験を提供
   * @returns すべてのリールが停止したことを示すPromise
   */
  private async stopReelsStaggered(): Promise<void> {
    const staggerDelay = 200; // 各リール間の遅延（ミリ秒）
    
    for (let i = 0; i < this.reelElements.length; i++) {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          const reel = this.reelElements[i];
          if (reel) {
            reel.classList.remove('spinning');
            reel.classList.add('stopped');
          }
          resolve();
        }, i * staggerDelay);
      });
    }
    
    // 停止クラスを削除（次のスピンのため）
    setTimeout(() => {
      this.reelElements.forEach(reel => {
        reel.classList.remove('stopped');
      });
    }, 100);
  }

  /**
   * スピンボタンのクリックイベントハンドラを登録
   * @param callback - ボタンがクリックされた時に呼び出される関数
   */
  onSpinButtonClick(callback: () => void): void {
    this.spinCallback = callback;
  }

  /**
   * アニメーション時間を設定
   * @param duration - アニメーション時間（ミリ秒）
   */
  setAnimationDuration(duration: number): void {
    if (duration < 0) {
      console.warn('アニメーション時間は0以上である必要があります。デフォルト値を使用します。');
      return;
    }
    this.animationDuration = duration;
  }

  /**
   * 現在のアニメーション時間を取得
   * @returns アニメーション時間（ミリ秒）
   */
  getAnimationDuration(): number {
    return this.animationDuration;
  }

  /**
   * アニメーション中かどうかを確認
   * @returns アニメーション中の場合はtrue
   */
  isSpinning(): boolean {
    return this.isAnimating;
  }

  /**
   * UIをクリーンアップ（テスト用）
   */
  cleanup(): void {
    if (this.spinButton) {
      this.spinButton.removeEventListener('click', () => this.handleSpinClick());
    }
    this.container.innerHTML = '';
    this.reelElements = [];
    this.spinButton = null;
    this.resultDisplay = null;
    this.spinCallback = null;
  }
}
