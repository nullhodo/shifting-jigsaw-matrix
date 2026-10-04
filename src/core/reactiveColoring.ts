import type { BoundaryLine } from "../types/jigsaw";

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
 * ピース (r, c) の持つ周囲境界線のうち、直近で動いた境界線の数を判定し、
 * 2辺以上が動いたピースを発光(1.0)させ、経過時間に応じてフェードアウトさせる更新関数
 */
export function updatePieceActivations(
  rows: number,
  cols: number,
  horizontalBoundaryLines: BoundaryLine[],
  verticalBoundaryLines: BoundaryLine[],
  currentTimestamp: number,
  fadeDurationMs: number,
  lastTriggerTimestamps: number[][],
  easingDurationMs = 600,
): {
  activationGrid: number[][];
  updatedTriggerTimestamps: number[][];
} {
  const activationGrid: number[][] = [];
  const updatedTriggerTimestamps: number[][] = [];

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
    const trigRow: number[] = [];

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

      // 持つ2辺が動いたかの判定:
      // 水平方向で1辺以上 かつ 垂直方向で1辺以上動いている、または自身を囲む辺のうち合計2辺以上が動いた場合
      const totalActiveEdges = horizontalActiveCount + verticalActiveCount;
      const hasTwoEdgesMoved =
        totalActiveEdges >= 2 ||
        (horizontalActiveCount >= 1 && verticalActiveCount >= 1);

      let lastTrigger = lastTriggerTimestamps[r]?.[c] ?? -999999;

      // 2辺が動いた場合、発色タイムスタンプを現在時刻にリフレッシュ
      if (hasTwoEdgesMoved) {
        lastTrigger = currentTimestamp;
      }
      trigRow.push(lastTrigger);

      // 時間経過に伴うフェードアウト計算 (1.0 -> 0.0)
      const elapsedSinceTrigger = currentTimestamp - lastTrigger;
      let activation = 0;
      if (
        elapsedSinceTrigger >= 0 &&
        elapsedSinceTrigger < fadeDurationMs
      ) {
        activation = 1.0 - elapsedSinceTrigger / fadeDurationMs;
      }

      actRow.push(Math.max(0, Math.min(1, activation)));
    }

    activationGrid.push(actRow);
    updatedTriggerTimestamps.push(trigRow);
  }

  return { activationGrid, updatedTriggerTimestamps };
}
