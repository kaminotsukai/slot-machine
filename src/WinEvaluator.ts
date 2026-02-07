import { WinEvaluator as IWinEvaluator } from './interfaces/WinEvaluator';
import { Symbol, WinResult, WinCondition } from './types';

/**
 * WinEvaluatorクラス
 * スピン結果を評価して勝敗を判定する
 *
 * 要件4.1, 4.2, 4.3に対応：
 * - 勝敗判定ロジックの実装
 * - 3つのシンボルがすべて同一の場合に勝利を宣言
 * - 適切な勝敗メッセージの生成
 */
export class WinEvaluator implements IWinEvaluator {
  private winConditions: WinCondition[] = [];

  constructor() {
    // デフォルトの勝利条件を設定：3つのシンボルがすべて同一
    this.addWinCondition({
      id: 'three_of_a_kind',
      name: '3つ揃い',
      pattern: (symbols: Symbol[]) => {
        if (symbols.length !== 3) return false;
        return symbols[0]!.id === symbols[1]!.id && symbols[1]!.id === symbols[2]!.id;
      },
      message: '🎉 おめでとうございます！3つ揃いで勝利です！',
    });
  }

  /**
   * シンボルの組み合わせを評価して勝敗結果を返す
   * @param symbols 評価するシンボルの配列（3つのリールの結果）
   * @returns 勝敗評価結果
   */
  evaluateResult(symbols: Symbol[]): WinResult {
    // 入力検証
    if (!symbols || symbols.length !== 3) {
      return {
        isWin: false,
        message: 'エラー：無効なシンボル配列です',
      };
    }

    // 各シンボルが有効かチェック
    for (const symbol of symbols) {
      if (!symbol || !symbol.id || !symbol.name || !symbol.displayValue) {
        return {
          isWin: false,
          message: 'エラー：無効なシンボルが含まれています',
        };
      }
    }

    // 勝利条件をチェック
    for (const condition of this.winConditions) {
      if (condition.pattern(symbols)) {
        return {
          isWin: true,
          winType: condition.id,
          message: condition.message,
        };
      }
    }

    // 勝利条件に該当しない場合は敗北
    return {
      isWin: false,
      message: `${symbols[0]!.displayValue} ${symbols[1]!.displayValue} ${symbols[2]!.displayValue} - 残念！次回頑張りましょう！`,
    };
  }

  /**
   * シンボルの組み合わせが勝利条件を満たすかチェック
   * @param symbols チェックするシンボルの配列
   * @returns 勝利条件を満たす場合はtrue
   */
  isWinningCombination(symbols: Symbol[]): boolean {
    // 入力検証
    if (!symbols || symbols.length !== 3) {
      return false;
    }

    // 各シンボルが有効かチェック
    for (const symbol of symbols) {
      if (!symbol || !symbol.id || !symbol.name || !symbol.displayValue) {
        return false;
      }
    }

    // いずれかの勝利条件を満たすかチェック
    return this.winConditions.some(condition => condition.pattern(symbols));
  }

  /**
   * 新しい勝利条件を追加
   * @param condition 追加する勝利条件
   */
  addWinCondition(condition: WinCondition): void {
    // 入力検証
    if (
      !condition ||
      !condition.id ||
      !condition.name ||
      !condition.pattern ||
      !condition.message
    ) {
      throw new Error('無効な勝利条件です');
    }

    // 同じIDの条件が既に存在するかチェック
    const existingIndex = this.winConditions.findIndex(c => c.id === condition.id);
    if (existingIndex >= 0) {
      // 既存の条件を更新
      this.winConditions[existingIndex] = condition;
    } else {
      // 新しい条件を追加
      this.winConditions.push(condition);
    }
  }

  /**
   * 現在設定されている勝利条件の一覧を取得
   * @returns 勝利条件の配列のコピー
   */
  getWinConditions(): WinCondition[] {
    // 配列のコピーを返して外部からの変更を防ぐ
    return [...this.winConditions];
  }
}
