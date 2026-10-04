import { describe, expect, it } from "vitest";
import {
  calculateCubicEaseInOut,
  updateBoundaryLinesMotion,
} from "../core/motion";
import type { BoundaryLine } from "../types/jigsaw";

describe("motion and easing calculations", () => {
  it("calculates cubic ease in-out correctly at key milestones", () => {
    expect(calculateCubicEaseInOut(0)).toBe(0);
    expect(calculateCubicEaseInOut(0.5)).toBeCloseTo(0.5, 4);
    expect(calculateCubicEaseInOut(1)).toBe(1);

    // Clamping checks
    expect(calculateCubicEaseInOut(-0.5)).toBe(0);
    expect(calculateCubicEaseInOut(1.5)).toBe(1);
  });

  it("is monotonically non-decreasing over [0, 1]", () => {
    let prev = 0;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const val = calculateCubicEaseInOut(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it("advances transitioning boundary line towards target step unit", () => {
    const dummyLine: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 1,
      shiftOffset: 0,
      isTransitioning: true,
      transitionStartTimestamp: 1000,
      tabDirections: [1, -1, 1],
    };

    const horizontalLines = [dummyLine];
    const verticalLines: BoundaryLine[] = [];

    // Halfway through 600ms easing (at 1300ms)
    updateBoundaryLinesMotion(
      horizontalLines,
      verticalLines,
      100,
      100,
      0, // no new triggers
      1200,
      600,
      1300,
      1000,
    );

    expect(dummyLine.currentStepUnit).toBeCloseTo(0.5, 2);
    expect(dummyLine.shiftOffset).toBeCloseTo(50, 1);
    expect(dummyLine.isTransitioning).toBe(true);

    // Completion at 1600ms
    updateBoundaryLinesMotion(
      horizontalLines,
      verticalLines,
      100,
      100,
      0,
      1200,
      600,
      1650,
      1000,
    );

    expect(dummyLine.currentStepUnit).toBe(1);
    expect(dummyLine.shiftOffset).toBe(100);
    expect(dummyLine.isTransitioning).toBe(false);
  });

  it("triggers multiple bursts with delay within a single interval cycle", () => {
    const dummyLine: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };

    const hLines = [dummyLine];
    const vLines: BoundaryLine[] = [];

    // t=0: Burst #1 triggers
    let res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0, // 100% trigger probability
      1200, // cycle interval
      400,
      0,
      -1,
      2, // 2 bursts per cycle
      250, // 250ms delay
      0,
    );
    expect(res.triggeredBurstsInCycle).toBe(1);
    expect(dummyLine.isTransitioning).toBe(true);
    expect(Math.abs(dummyLine.targetStepUnit)).toBe(1);

    // t=100: Before burst delay, no new trigger
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1200,
      400,
      100,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(res.triggeredBurstsInCycle).toBe(1);

    // t=250: Burst #2 triggers, queuing a second step
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1200,
      400,
      250,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(res.triggeredBurstsInCycle).toBe(2);
    expect(Math.abs(dummyLine.pendingSteps || 0)).toBe(1);

    // t=400: First transition completes, automatically starts queued second step towards next unit
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1200,
      400,
      401,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(dummyLine.isTransitioning).toBe(true);
    expect(dummyLine.pendingSteps).toBe(0);
  });
});
