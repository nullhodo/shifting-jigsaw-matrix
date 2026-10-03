import type { BoundaryLine } from "../types/jigsaw";

/**
 * 3次加減速 (Cubic Ease In-Out) 計算関数
 * @param progress 0.0〜1.0 の正規化進行度
 * @returns イージング後の値 (0.0〜1.0)
 */
export function calculateCubicEaseInOut(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - (-2 * clamped + 2) ** 3 / 2;
}

/**
 * 一定時間ごとに確率で各境界線の1区間移動を開始し、イージングで滑らかに移動量を計算する関数
 */
export function updateBoundaryLinesMotion(
  horizontalBoundaryLines: BoundaryLine[],
  verticalBoundaryLines: BoundaryLine[],
  singleCellWidth: number,
  singleCellHeight: number,
  motionProbability: number,
  stepIntervalMilliseconds: number,
  easingDurationMilliseconds: number,
  currentTimestamp: number,
  lastStepCheckTimestamp: number,
): { newLastCheckTimestamp: number } {
  let newLastCheck = lastStepCheckTimestamp;

  // 一定時間ごとに各線の移動可否を確率で判定
  if (
    currentTimestamp - lastStepCheckTimestamp >=
    stepIntervalMilliseconds
  ) {
    newLastCheck = currentTimestamp;

    for (let hIdx = 0; hIdx < horizontalBoundaryLines.length; hIdx++) {
      const line = horizontalBoundaryLines[hIdx];
      if (!line.isTransitioning) {
        if (Math.random() < motionProbability) {
          const moveDir =
            Math.random() < 0.15
              ? -line.defaultDirection
              : line.defaultDirection;
          line.previousStepUnit = line.currentStepUnit;
          line.targetStepUnit = line.currentStepUnit + moveDir;
          line.isTransitioning = true;
          line.transitionStartTimestamp = currentTimestamp;
        }
      }
    }

    for (let vIdx = 0; vIdx < verticalBoundaryLines.length; vIdx++) {
      const line = verticalBoundaryLines[vIdx];
      if (!line.isTransitioning) {
        if (Math.random() < motionProbability) {
          const moveDir =
            Math.random() < 0.15
              ? -line.defaultDirection
              : line.defaultDirection;
          line.previousStepUnit = line.currentStepUnit;
          line.targetStepUnit = line.currentStepUnit + moveDir;
          line.isTransitioning = true;
          line.transitionStartTimestamp = currentTimestamp;
        }
      }
    }
  }

  // 水平境界線のイージング補間計算
  for (let hIdx = 0; hIdx < horizontalBoundaryLines.length; hIdx++) {
    const line = horizontalBoundaryLines[hIdx];
    if (line.isTransitioning) {
      const elapsed = currentTimestamp - line.transitionStartTimestamp;
      const normalized = Math.min(
        1.0,
        elapsed / easingDurationMilliseconds,
      );
      const eased = calculateCubicEaseInOut(normalized);

      line.currentStepUnit =
        line.previousStepUnit +
        (line.targetStepUnit - line.previousStepUnit) * eased;

      if (normalized >= 1.0) {
        line.currentStepUnit = line.targetStepUnit;
        line.isTransitioning = false;
      }
    }
    line.shiftOffset = line.currentStepUnit * singleCellWidth;
  }

  // 垂直境界線のイージング補間計算
  for (let vIdx = 0; vIdx < verticalBoundaryLines.length; vIdx++) {
    const line = verticalBoundaryLines[vIdx];
    if (line.isTransitioning) {
      const elapsed = currentTimestamp - line.transitionStartTimestamp;
      const normalized = Math.min(
        1.0,
        elapsed / easingDurationMilliseconds,
      );
      const eased = calculateCubicEaseInOut(normalized);

      line.currentStepUnit =
        line.previousStepUnit +
        (line.targetStepUnit - line.previousStepUnit) * eased;

      if (normalized >= 1.0) {
        line.currentStepUnit = line.targetStepUnit;
        line.isTransitioning = false;
      }
    }
    line.shiftOffset = line.currentStepUnit * singleCellHeight;
  }

  return { newLastCheckTimestamp: newLastCheck };
}
