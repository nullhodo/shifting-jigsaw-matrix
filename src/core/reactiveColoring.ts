import type { BoundaryLine } from "../types/jigsaw";
import { calculateCubicEaseInOut } from "./motion";

/**
 * 2つのHex色を比率 t (0.0〜1.0) で線形補間し、rgb(r,g,b) 文字列を返す関数
 */
export function interpolateHexColor(
  colorA: string,
  colorB: string,
  t: number,
): string {
  if (t <= 0) return colorA;
  if (t >= 1) return colorB;

  const parseHex = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      return [
        Number.parseInt(clean[0] + clean[0], 16) || 0,
        Number.parseInt(clean[1] + clean[1], 16) || 0,
        Number.parseInt(clean[2] + clean[2], 16) || 0,
      ];
    }
    const num = Number.parseInt(clean, 16);
    if (Number.isNaN(num)) return [0, 0, 0];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const [rA, gA, bA] = parseHex(colorA);
  const [rB, gB, bB] = parseHex(colorB);

  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round(rA + (rB - rA) * clampedT);
  const g = Math.round(gA + (gB - gA) * clampedT);
  const b = Math.round(bA + (bB - bA) * clampedT);

  return `rgb(${r},${g},${b})`;
}

/**
 * 全セル 0.0 で初期化された活性度グリッドを生成
 */
export function initializeActivationGrid(
  rows: number,
  cols: number,
): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(0));
  }
  return grid;
}

/**
 * 各ピースの活性度イージング状態
 */
export interface PieceActivationState {
  triggerStartTimestamp: number;
  startActivation: number;
  currentActivation: number;
  wasActive?: boolean;
  wasTwoEdgesActive?: boolean;
}

/**
 * 全ピースの初期活性度状態グリッドを生成
 */
export function initializePieceActivationStates(
  rows: number,
  cols: number,
): PieceActivationState[][] {
  const grid: PieceActivationState[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: PieceActivationState[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        triggerStartTimestamp: -999999,
        startActivation: 0,
        currentActivation: 0,
        wasActive: false,
        wasTwoEdgesActive: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * ピース (r, c) の持つ周囲境界線のうち、直近で動いた境界線の数を判定し、
 * 指定された辺数（1辺または2辺）が動いたピースをイージングで滑らかに発光(fade-in)させ、
 * 移動完了後にイージングで滑らかにフェードアウト(fade-out)させる更新関数
 */
export function updatePieceActivations(
  rows: number,
  cols: number,
  horizontalBoundaryLines: BoundaryLine[],
  verticalBoundaryLines: BoundaryLine[],
  currentTimestamp: number,
  fadeInDurationMs: number,
  fadeOutDurationMs: number,
  pieceStates: PieceActivationState[][],
  easingDurationMs = 600,
  triggerEdges: 1 | 2 = 2,
  fadeInDelayMs = 0,
): {
  activationGrid: number[][];
  updatedPieceStates: PieceActivationState[][];
} {
  const activationGrid: number[][] = [];
  const updatedPieceStates: PieceActivationState[][] = [];

  // 直近で移動したとみなす時間窓 (移動中または直近の移動開始から時間窓以内)
  const recentWindowMs = Math.max(easingDurationMs, 400);

  const isLineRecentlyActive = (
    line: BoundaryLine | undefined,
  ): boolean => {
    if (!line) return false;
    if (line.isTransitioning) return true;
    return (
      currentTimestamp - line.transitionStartTimestamp >= 0 &&
      currentTimestamp - line.transitionStartTimestamp <= recentWindowMs
    );
  };

  for (let r = 0; r < rows; r++) {
    const actRow: number[] = [];
    const stateRow: PieceActivationState[] = [];

    // 上下の水平境界線
    const lineTop = r > 0 ? horizontalBoundaryLines[r - 1] : undefined;
    const lineBottom =
      r < rows - 1 ? horizontalBoundaryLines[r] : undefined;

    const topActive = isLineRecentlyActive(lineTop);
    const bottomActive = isLineRecentlyActive(lineBottom);
    const horizontalActiveCount =
      (topActive ? 1 : 0) + (bottomActive ? 1 : 0);

    for (let c = 0; c < cols; c++) {
      // 左右の垂直境界線
      const lineLeft = c > 0 ? verticalBoundaryLines[c - 1] : undefined;
      const lineRight =
        c < cols - 1 ? verticalBoundaryLines[c] : undefined;

      const leftActive = isLineRecentlyActive(lineLeft);
      const rightActive = isLineRecentlyActive(lineRight);
      const verticalActiveCount =
        (leftActive ? 1 : 0) + (rightActive ? 1 : 0);

      // 持つ1辺または2辺が動いたかの判定
      const totalActiveEdges = horizontalActiveCount + verticalActiveCount;
      const isPieceTriggered =
        triggerEdges === 1
          ? totalActiveEdges >= 1
          : totalActiveEdges >= 2 ||
            (horizontalActiveCount >= 1 && verticalActiveCount >= 1);

      const prevState = pieceStates?.[r]?.[c] ?? {
        triggerStartTimestamp: -999999,
        startActivation: 0,
        currentActivation: 0,
        wasActive: false,
      };

      let triggerStartTimestamp = prevState.triggerStartTimestamp;
      let startActivation = prevState.startActivation;
      let wasActive =
        prevState.wasActive ?? prevState.wasTwoEdgesActive ?? false;
      let currentActivation = prevState.currentActivation;

      if (isPieceTriggered) {
        if (!wasActive) {
          // 移動開始: 現在の活性度を開始点としてフェードイン待機/イージングを開始
          triggerStartTimestamp = currentTimestamp;
          startActivation = prevState.currentActivation;
          wasActive = true;
        }

        const elapsed = Math.max(
          0,
          currentTimestamp - triggerStartTimestamp,
        );
        if (elapsed < fadeInDelayMs) {
          // 遅延期間中: 開始時の活性度を維持（まだ色づき始めない）
          currentActivation = startActivation;
        } else {
          // 色づきイージング (startActivation -> 1.0)
          const activeElapsed = elapsed - fadeInDelayMs;
          const progress = Math.min(
            1,
            activeElapsed / Math.max(1, fadeInDurationMs),
          );
          const eased = calculateCubicEaseInOut(progress);
          currentActivation =
            startActivation + (1.0 - startActivation) * eased;
        }
      } else {
        const elapsedSinceTrigger = Math.max(
          0,
          currentTimestamp - triggerStartTimestamp,
        );
        const minActiveDuration = fadeInDelayMs + fadeInDurationMs;
        const hasCompletedFadeIn =
          prevState.currentActivation >= 1.0 ||
          elapsedSinceTrigger >= minActiveDuration;

        // 辺の移動が終了しても、フェードイン未完了（遅延+色づき時間の途中）なら1.0到達まで色づきを継続
        if (wasActive && !hasCompletedFadeIn) {
          if (elapsedSinceTrigger < fadeInDelayMs) {
            currentActivation = startActivation;
          } else {
            const activeElapsed = elapsedSinceTrigger - fadeInDelayMs;
            const progress = Math.min(
              1,
              activeElapsed / Math.max(1, fadeInDurationMs),
            );
            const eased = calculateCubicEaseInOut(progress);
            currentActivation =
              startActivation + (1.0 - startActivation) * eased;
          }
        } else {
          if (wasActive) {
            // 移動完了かつフェードイン完了後: 現在の活性度を開始点としてフェードアウトを開始
            triggerStartTimestamp = currentTimestamp;
            startActivation = currentActivation;
            wasActive = false;
          }

          // イージング付きフェードアウト (startActivation -> 0.0)
          const elapsed = Math.max(
            0,
            currentTimestamp - triggerStartTimestamp,
          );
          const progress = Math.min(
            1,
            elapsed / Math.max(1, fadeOutDurationMs),
          );
          const eased = calculateCubicEaseInOut(progress);
          currentActivation = Math.max(0, startActivation * (1.0 - eased));
        }
      }

      currentActivation = Math.max(0, Math.min(1, currentActivation));

      actRow.push(currentActivation);
      stateRow.push({
        triggerStartTimestamp,
        startActivation,
        currentActivation,
        wasActive,
        wasTwoEdgesActive: wasActive,
      });
    }

    activationGrid.push(actRow);
    updatedPieceStates.push(stateRow);
  }

  return { activationGrid, updatedPieceStates };
}
