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
  const safeBurstCount = Math.max(1, Math.min(5, Math.round(burstCount)));
  const safeBurstDelay = Math.max(0, burstDelayMilliseconds);
  const safeEasingDuration = Math.max(50, easingDurationMilliseconds);

  // 各バーストステップの間隔：1回の移動所要時間 + バースト間の待機遅延
  const burstStepDuration = safeEasingDuration + safeBurstDelay;

  // 1サイクル内の全バースト移動が完了するまでの総所要時間
  const totalBurstMotionDuration =
    safeBurstCount <= 1
      ? safeEasingDuration
      : (safeBurstCount - 1) * burstStepDuration + safeEasingDuration;

  // 1サイクルの実効周期（全バーストが完了して全ラインが静止するのを必ず待つ）
  const effectiveCycleInterval = Math.max(
    stepIntervalMilliseconds,
    totalBurstMotionDuration + 50,
  );

  let cycleStart = lastStepCheckTimestamp;
  let burstsDone = triggeredBurstsInCycle;

  // 初回未初期化時 (負値相当) または全バースト完了後に周期超過時に新周期を開始
  if (cycleStart < 0) {
    cycleStart = currentTimestamp;
    burstsDone = 0;
  } else if (
    currentTimestamp - cycleStart >= effectiveCycleInterval &&
    (burstsDone >= safeBurstCount || burstsDone === 0)
  ) {
    cycleStart = currentTimestamp;
    burstsDone = 0;
  } else if (currentTimestamp - cycleStart >= effectiveCycleInterval * 2) {
    // タブ復帰時などの大幅な時刻飛びへの安全策
    cycleStart = currentTimestamp;
    burstsDone = 0;
  }

  const elapsed = Math.max(0, currentTimestamp - cycleStart);

  // 周期内で現時刻までに到達しているべきバースト回数を算出
  let expectedBursts = 0;
  if (safeBurstCount > 0) {
    expectedBursts = Math.min(
      safeBurstCount,
      Math.floor(elapsed / burstStepDuration) + 1,
    );
  }

  // 未発火のバーストを順次実行（1フレームで実行するのは直近の未発火1ステップのみとし、多重発火・連打を防止）
  if (expectedBursts > burstsDone) {
    const nextBurstIndex = burstsDone;
    const burstScheduledTime =
      cycleStart + nextBurstIndex * burstStepDuration;

    // 水平境界線の移動判定
    for (let hIdx = 0; hIdx < horizontalBoundaryLines.length; hIdx++) {
      const line = horizontalBoundaryLines[hIdx];
      if (motionProbability > 0 && Math.random() < motionProbability) {
        if (line.isTransitioning) {
          line.currentStepUnit = line.targetStepUnit;
          line.previousStepUnit = line.targetStepUnit;
          line.isTransitioning = false;
        }
        line.pendingSteps = 0;

        const moveDir =
          Math.random() < 0.15
            ? -line.defaultDirection
            : line.defaultDirection;
        line.previousStepUnit = line.currentStepUnit;
        line.targetStepUnit = line.currentStepUnit + moveDir;
        line.isTransitioning = true;
        line.transitionStartTimestamp = burstScheduledTime;
      }
    }

    // 垂直境界線の移動判定
    for (let vIdx = 0; vIdx < verticalBoundaryLines.length; vIdx++) {
      const line = verticalBoundaryLines[vIdx];
      if (motionProbability > 0 && Math.random() < motionProbability) {
        if (line.isTransitioning) {
          line.currentStepUnit = line.targetStepUnit;
          line.previousStepUnit = line.targetStepUnit;
          line.isTransitioning = false;
        }
        line.pendingSteps = 0;

        const moveDir =
          Math.random() < 0.15
            ? -line.defaultDirection
            : line.defaultDirection;
        line.previousStepUnit = line.currentStepUnit;
        line.targetStepUnit = line.currentStepUnit + moveDir;
        line.isTransitioning = true;
        line.transitionStartTimestamp = burstScheduledTime;
      }
    }

    burstsDone = nextBurstIndex + 1;
  }

  // 水平境界線のイージング補間計算
  for (let hIdx = 0; hIdx < horizontalBoundaryLines.length; hIdx++) {
    const line = horizontalBoundaryLines[hIdx];
    if (line.isTransitioning) {
      const lineElapsed = Math.max(
        0,
        currentTimestamp - line.transitionStartTimestamp,
      );
      const normalized = Math.min(1.0, lineElapsed / safeEasingDuration);
      const eased = calculateCubicEaseInOut(normalized);

      line.currentStepUnit =
        line.previousStepUnit +
        (line.targetStepUnit - line.previousStepUnit) * eased;

      if (normalized >= 1.0) {
        line.currentStepUnit = line.targetStepUnit;
        line.isTransitioning = false;
        line.pendingSteps = 0;
      }
    }
    line.shiftOffset = line.currentStepUnit * singleCellWidth;
  }

  // 垂直境界線のイージング補間計算
  for (let vIdx = 0; vIdx < verticalBoundaryLines.length; vIdx++) {
    const line = verticalBoundaryLines[vIdx];
    if (line.isTransitioning) {
      const lineElapsed = Math.max(
        0,
        currentTimestamp - line.transitionStartTimestamp,
      );
      const normalized = Math.min(1.0, lineElapsed / safeEasingDuration);
      const eased = calculateCubicEaseInOut(normalized);

      line.currentStepUnit =
        line.previousStepUnit +
        (line.targetStepUnit - line.previousStepUnit) * eased;

      if (normalized >= 1.0) {
        line.currentStepUnit = line.targetStepUnit;
        line.isTransitioning = false;
        line.pendingSteps = 0;
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
