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

export interface MotionUpdateResult {
  newLastCheckTimestamp: number;
  cycleStartTimestamp: number;
  triggeredBurstsInCycle: number;
}

/**
 * 一定周期ごとに設定された回数（バースト）および遅延で各境界線の移動を開始し、イージングで滑らかに移動量を計算する関数
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
  burstCount = 1,
  burstDelayMilliseconds = 250,
  triggeredBurstsInCycle = 0,
): MotionUpdateResult {
  let cycleStart = lastStepCheckTimestamp;
  let burstsDone = triggeredBurstsInCycle;

  // 初回未初期化時 (負値または未定義相当) または周期超過時に新周期を開始
  if (cycleStart < 0) {
    cycleStart = currentTimestamp;
    burstsDone = 0;
  } else if (currentTimestamp - cycleStart >= stepIntervalMilliseconds) {
    cycleStart = currentTimestamp;
    burstsDone = 0;
  }

  const elapsed = Math.max(0, currentTimestamp - cycleStart);

  // 周期内で現時刻までに発火すべきバースト回数を算出
  const safeBurstCount = Math.max(1, Math.min(5, Math.round(burstCount)));
  const safeDelay = Math.max(50, burstDelayMilliseconds);
  const expectedBursts = Math.min(
    safeBurstCount,
    Math.floor(elapsed / safeDelay) + 1,
  );

  // 未発火のバーストを順次実行
  if (expectedBursts > burstsDone) {
    const burstTriggersCount = expectedBursts - burstsDone;
    for (let b = 0; b < burstTriggersCount; b++) {
      // 水平境界線の移動判定
      for (let hIdx = 0; hIdx < horizontalBoundaryLines.length; hIdx++) {
        const line = horizontalBoundaryLines[hIdx];
        if (Math.random() < motionProbability) {
          const moveDir =
            Math.random() < 0.15
              ? -line.defaultDirection
              : line.defaultDirection;
          if (!line.isTransitioning) {
            line.previousStepUnit = line.currentStepUnit;
            line.targetStepUnit = line.currentStepUnit + moveDir;
            line.isTransitioning = true;
            line.transitionStartTimestamp = currentTimestamp;
          } else {
            // 移動中に次のバーストが当たった場合はキューに移動を予約
            line.pendingSteps = (line.pendingSteps || 0) + moveDir;
          }
        }
      }

      // 垂直境界線の移動判定
      for (let vIdx = 0; vIdx < verticalBoundaryLines.length; vIdx++) {
        const line = verticalBoundaryLines[vIdx];
        if (Math.random() < motionProbability) {
          const moveDir =
            Math.random() < 0.15
              ? -line.defaultDirection
              : line.defaultDirection;
          if (!line.isTransitioning) {
            line.previousStepUnit = line.currentStepUnit;
            line.targetStepUnit = line.currentStepUnit + moveDir;
            line.isTransitioning = true;
            line.transitionStartTimestamp = currentTimestamp;
          } else {
            // 移動中に次のバーストが当たった場合はキューに移動を予約
            line.pendingSteps = (line.pendingSteps || 0) + moveDir;
          }
        }
      }
    }
    burstsDone = expectedBursts;
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
        // 予約されたステップがあれば連続して遷移を開始
        if (line.pendingSteps && line.pendingSteps !== 0) {
          const nextDir = line.pendingSteps > 0 ? 1 : -1;
          line.pendingSteps -= nextDir;
          line.previousStepUnit = line.currentStepUnit;
          line.targetStepUnit = line.currentStepUnit + nextDir;
          line.isTransitioning = true;
          line.transitionStartTimestamp = currentTimestamp;
        } else {
          line.isTransitioning = false;
          line.pendingSteps = 0;
        }
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
        // 予約されたステップがあれば連続して遷移を開始
        if (line.pendingSteps && line.pendingSteps !== 0) {
          const nextDir = line.pendingSteps > 0 ? 1 : -1;
          line.pendingSteps -= nextDir;
          line.previousStepUnit = line.currentStepUnit;
          line.targetStepUnit = line.currentStepUnit + nextDir;
          line.isTransitioning = true;
          line.transitionStartTimestamp = currentTimestamp;
        } else {
          line.isTransitioning = false;
          line.pendingSteps = 0;
        }
      }
    }
    line.shiftOffset = line.currentStepUnit * singleCellHeight;
  }

  return {
    newLastCheckTimestamp: cycleStart,
    cycleStartTimestamp: cycleStart,
    triggeredBurstsInCycle: burstsDone,
  };
}
