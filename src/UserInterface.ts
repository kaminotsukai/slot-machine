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
  private stopButtons: HTMLButtonElement[] = [];
  private resultDisplay: HTMLElement | null = null;
  private container: HTMLElement;
  private spinCallback: (() => void) | null = null;
  private stopCallback: ((reelIndex: number) => void) | null = null;
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
   * 3つのリール、各リールの停止ボタン、スピンボタン、結果表示エリアを作成します
   */
  private initializeUI(): void {
    // コンテナをクリア
    this.container.innerHTML = '';
    this.container.className = 'slot-machine';

    // リールコンテナを作成
    const reelsContainer = document.createElement('div');
    reelsContainer.className = 'reels-container';

    // 3つのリールと停止ボタンを作成
    for (let i = 0; i < 3; i++) {
      const reelWrapper = document.createElement('div');
      reelWrapper.className = 'reel-wrapper';
      
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.setAttribute('data-reel-index', i.toString());
      
      // リールの初期表示（空）
      const symbolDisplay = document.createElement('div');
      symbolDisplay.className = 'symbol-display';
      symbolDisplay.textContent = '?';
      
      reel.appendChild(symbolDisplay);
      reelWrapper.appendChild(reel);
      
      // 各リールの停止ボタンを作成
      const stopButton = document.createElement('button');
      stopButton.className = 'stop-button';
      stopButton.textContent = `停止 ${i + 1}`;
      stopButton.type = 'button';
      stopButton.disabled = true; // 初期状態では無効
      stopButton.setAttribute('data-reel-index', i.toString());
      stopButton.addEventListener('click', () => this.handleStopClick(i));
      
      reelWrapper.appendChild(stopButton);
      reelsContainer.appendChild(reelWrapper);
      
      this.reelElements.push(reel);
      this.stopButtons.push(stopButton);
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
   * 停止ボタンのクリックを処理
   * @param reelIndex - 停止するリールのインデックス
   */
  private handleStopClick(reelIndex: number): void {
    if (this.stopCallback) {
      this.stopCallback(reelIndex);
    }
  }

  /**
   * 停止ボタンの状態を設定
   * @param enabledStates - 各停止ボタンの有効/無効状態の配列
   * 
   * 要件: 2.4 - リール回転開始時に停止ボタンを有効化
   * 要件: 2.6 - リール停止時に停止ボタンを無効化
   * 要件: 5.3 - 各リールに対応する停止ボタンを配置
   * 要件: 5.8 - 各ボタンがどのリールに対応するかを明確に示す
   * 要件: 6.5 - 部分停止状態中、停止していないリールの停止ボタンのみを有効化
   */
  displayStopButtons(enabledStates: boolean[]): void {
    if (enabledStates.length !== 3) {
      console.error('Expected exactly 3 enabled states, got:', enabledStates.length);
      return;
    }

    enabledStates.forEach((enabled, index) => {
      const button = this.stopButtons[index];
      if (button) {
        button.disabled = !enabled;
        
        if (enabled) {
          button.classList.remove('disabled');
          button.classList.add('enabled');
        } else {
          button.classList.remove('enabled');
          button.classList.add('disabled');
        }
      }
    });
  }

  /**
   * リールにシンボルを表示
   * @param symbols - 表示するシンボルの配列（nullの場合は回転中を示す）
   * 
   * 要件: 5.1 - リールを目立つように表示
   */
  displayReels(symbols: (Symbol | null)[]): void {
    if (symbols.length !== 3) {
      console.error('Expected exactly 3 symbols, got:', symbols.length);
      return;
    }

    symbols.forEach((symbol, index) => {
      const reel = this.reelElements[index];
      if (reel) {
        const symbolDisplay = reel.querySelector('.symbol-display');
        if (symbolDisplay) {
          if (symbol === null) {
            // nullの場合は回転中を示す
            symbolDisplay.textContent = '🎰';
            symbolDisplay.removeAttribute('data-symbol-id');
            symbolDisplay.removeAttribute('title');
          } else {
            symbolDisplay.textContent = symbol.displayValue;
            symbolDisplay.setAttribute('data-symbol-id', symbol.id);
            symbolDisplay.setAttribute('title', symbol.name);
          }
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
   * 個別リールのスピンアニメーションを開始
   * @param reelIndex - アニメーションを開始するリールのインデックス（省略時は全リール）
   * 
   * 要件: 2.3 - 回転動作を示す視覚的フィードバックを表示
   */
  startSpinAnimation(reelIndex?: number): void {
    if (reelIndex !== undefined) {
      // 特定のリールのみアニメーション開始
      const reel = this.reelElements[reelIndex];
      if (reel) {
        reel.classList.add('spinning');
        const symbolDisplay = reel.querySelector('.symbol-display');
        if (symbolDisplay) {
          symbolDisplay.textContent = '🎰';
        }
      }
    } else {
      // 全リールのアニメーション開始
      this.isAnimating = true;
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
    }
  }

  /**
   * 個別リールのスピンアニメーションを停止
   * @param reelIndex - アニメーションを停止するリールのインデックス
   * 
   * 要件: 2.5 - 対応するリールを停止させ、最終シンボルを表示
   */
  stopSpinAnimation(reelIndex: number): void {
    const reel = this.reelElements[reelIndex];
    if (reel) {
      reel.classList.remove('spinning');
      reel.classList.add('stopped');
      
      // 停止エフェクトを短時間表示後に削除
      setTimeout(() => {
        reel.classList.remove('stopped');
      }, 300);
    }
    
    // 全リールが停止したかチェック
    const allStopped = this.reelElements.every(r => !r.classList.contains('spinning'));
    if (allStopped) {
      this.isAnimating = false;
    }
  }

  /**
   * スピンボタンのクリックイベントハンドラを登録
   * @param callback - ボタンがクリックされた時に呼び出される関数
   */
  onSpinButtonClick(callback: () => void): void {
    this.spinCallback = callback;
  }

  /**
   * 停止ボタンのクリックイベントハンドラを登録
   * @param callback - ボタンがクリックされた時に呼び出される関数（リールインデックスを受け取る）
   */
  onStopButtonClick(callback: (reelIndex: number) => void): void {
    this.stopCallback = callback;
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
    this.stopButtons.forEach((button, index) => {
      button.removeEventListener('click', () => this.handleStopClick(index));
    });
    this.container.innerHTML = '';
    this.reelElements = [];
    this.stopButtons = [];
    this.spinButton = null;
    this.resultDisplay = null;
    this.spinCallback = null;
    this.stopCallback = null;
  }
}
