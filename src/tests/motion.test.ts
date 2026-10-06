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

  it("triggers multiple bursts with synchronized delays across boundary lines without timing drift", () => {
    const dummyLineA: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };
    const dummyLineB: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };

    const hLines = [dummyLineA, dummyLineB];
    const vLines: BoundaryLine[] = [];

    // t=0: Burst #1 triggers simultaneously for lines
    let res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0, // 100% trigger probability
      1500, // cycle interval
      400, // easing duration
      0,
      -1,
      2, // 2 bursts per cycle
      250, // 250ms delay
      0,
    );
    expect(res.triggeredBurstsInCycle).toBe(1);
    expect(dummyLineA.isTransitioning).toBe(true);
    expect(dummyLineB.isTransitioning).toBe(true);
    expect(dummyLineA.transitionStartTimestamp).toBe(
      dummyLineB.transitionStartTimestamp,
    );
    expect(Math.abs(dummyLineA.targetStepUnit)).toBe(1);

    // t=400: First transition completes cleanly, lines rest during burst delay
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1500,
      400,
      400,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(dummyLineA.isTransitioning).toBe(false);
    expect(dummyLineB.isTransitioning).toBe(false);
    expect(dummyLineA.currentStepUnit).toBe(1);
    expect(res.triggeredBurstsInCycle).toBe(1);

    // t=500: During burst delay interval, no premature second burst
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1500,
      400,
      500,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(res.triggeredBurstsInCycle).toBe(1);
    expect(dummyLineA.isTransitioning).toBe(false);

    // t=650: Burst #2 triggers after easingDuration (400) + burstDelay (250)
    // Both lines start transitioning at the exact same scheduled timestamp
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1500,
      400,
      650,
      res.cycleStartTimestamp,
      2,
      250,
      res.triggeredBurstsInCycle,
    );
    expect(res.triggeredBurstsInCycle).toBe(2);
    expect(dummyLineA.isTransitioning).toBe(true);
    expect(dummyLineB.isTransitioning).toBe(true);
    expect(dummyLineA.transitionStartTimestamp).toBe(650);
    expect(dummyLineB.transitionStartTimestamp).toBe(650);
    expect(dummyLineA.targetStepUnit).toBe(2);
    expect(dummyLineB.targetStepUnit).toBe(2);
  });

  it("ensures inactive line and active line synchronize start timestamps on subsequent burst", () => {
    // Line A was in transition, Line B was idle
    const lineA: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0.8,
      previousStepUnit: 0,
      targetStepUnit: 1,
      shiftOffset: 80,
      isTransitioning: true,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };
    const lineB: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };

    const hLines = [lineA, lineB];
    const vLines: BoundaryLine[] = [];

    // Trigger next burst at t=500 (burstStepDuration=500)
    const res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      1500,
      300,
      500,
      0, // cycleStart = 0
      2,
      200,
      1, // 1 burst already done
    );

    expect(res.triggeredBurstsInCycle).toBe(2);
    // Line A has been cleanly finished to target (1) and both start new step together
    expect(lineA.isTransitioning).toBe(true);
    expect(lineB.isTransitioning).toBe(true);
    expect(lineA.transitionStartTimestamp).toBe(500);
    expect(lineB.transitionStartTimestamp).toBe(500);
    expect(Math.abs(lineA.targetStepUnit - lineA.previousStepUnit)).toBe(
      1,
    );
    expect(lineB.previousStepUnit).toBe(0);
    expect(Math.abs(lineB.targetStepUnit)).toBe(1);
  });

  it("prevents burst storm and keeps line synchronization when parameters are changed dynamically", () => {
    const lineA: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };
    const lineB: BoundaryLine = {
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections: [1],
    };

    const hLines = [lineA, lineB];
    const vLines: BoundaryLine[] = [];

    // t=0: Burst 1 fires
    let res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      2000,
      300,
      0,
      0,
      3,
      300,
      0,
    );
    expect(res.triggeredBurstsInCycle).toBe(1);

    // Dynamic slider tweak: user reduces burstDelay from 300 to 50 at t=400
    // With old burstStepDuration, step 2 was at 600. With new, step 2 is at 350.
    // Ensure only 1 burst triggers per update frame instead of bursting multiple times
    res = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      2000,
      300,
      400,
      0,
      3,
      50, // tweaked delay
      res.triggeredBurstsInCycle,
    );
    expect(res.triggeredBurstsInCycle).toBe(2);
    // Both lines start transitioning simultaneously at the burst timestamp
    expect(lineA.isTransitioning).toBe(true);
    expect(lineB.isTransitioning).toBe(true);
    expect(lineA.transitionStartTimestamp).toBe(
      lineB.transitionStartTimestamp,
    );

    // Another dynamic tweak: user shortens stepInterval to 400 (shorter than total bursts duration)
    // Verify new cycle does NOT interrupt while bursts are still active
    const resShort = updateBoundaryLinesMotion(
      hLines,
      vLines,
      100,
      100,
      1.0,
      400, // shortened interval
      300,
      450,
      0,
      3,
      50,
      res.triggeredBurstsInCycle,
    );
    // Cycle must not restart prematurely
    expect(resShort.cycleStartTimestamp).toBe(0);
  });
});
