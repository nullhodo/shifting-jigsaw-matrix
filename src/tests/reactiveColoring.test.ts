import { describe, expect, it } from "vitest";
import {
  initializeActivationGrid,
  interpolateHexColor,
  updatePieceActivations,
} from "../core/reactiveColoring";
import type { BoundaryLine } from "../types/jigsaw";

describe("reactiveColoring module", () => {
  describe("interpolateHexColor", () => {
    it("returns colorA at t <= 0 and colorB at t >= 1", () => {
      expect(interpolateHexColor("#000000", "#ffffff", 0)).toBe("#000000");
      expect(interpolateHexColor("#000000", "#ffffff", -0.5)).toBe(
        "#000000",
      );
      expect(interpolateHexColor("#000000", "#ffffff", 1)).toBe("#ffffff");
      expect(interpolateHexColor("#000000", "#ffffff", 1.5)).toBe(
        "#ffffff",
      );
    });

    it("linearly interpolates between colors at t = 0.5", () => {
      const mid = interpolateHexColor("#000000", "#ffffff", 0.5);
      expect(mid).toBe("rgb(128,128,128)");

      const redToBlue = interpolateHexColor("#ff0000", "#0000ff", 0.5);
      expect(redToBlue).toBe("rgb(128,0,128)");
    });

    it("handles 3-digit shorthand hex strings", () => {
      const result = interpolateHexColor("#000", "#fff", 0.5);
      expect(result).toBe("rgb(128,128,128)");
    });
  });

  describe("initializeActivationGrid", () => {
    it("generates an empty 2D grid with specified rows and cols filled with 0", () => {
      const grid = initializeActivationGrid(3, 4);
      expect(grid.length).toBe(3);
      for (const row of grid) {
        expect(row.length).toBe(4);
        expect(row.every((val) => val === 0)).toBe(true);
      }
    });
  });

  describe("updatePieceActivations", () => {
    const createDummyLine = (
      isTransitioning: boolean,
      transitionStartTimestamp: number,
    ): BoundaryLine => ({
      defaultDirection: 1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 1,
      shiftOffset: 0,
      isTransitioning,
      transitionStartTimestamp,
      tabDirections: [1, -1, 1],
    });

    it("keeps activation at 0 when no boundaries are moving", () => {
      const hLines = [
        createDummyLine(false, 0),
        createDummyLine(false, 0),
      ];
      const vLines = [
        createDummyLine(false, 0),
        createDummyLine(false, 0),
      ];
      const triggerTimestamps: number[][] = [];

      const result = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        1000,
        triggerTimestamps,
        600,
      );

      for (const row of result.activationGrid) {
        expect(row.every((val) => val === 0)).toBe(true);
      }
    });

    it("activates a piece when at least 2 of its edges are moving", () => {
      // 3 rows x 3 cols:
      // horizontal boundary index 0 is between row 0 and row 1
      // vertical boundary index 0 is between col 0 and col 1
      // Piece at (0, 0) has bottom boundary hLines[0] and right boundary vLines[0]
      const hLines = [
        createDummyLine(true, 1000),
        createDummyLine(false, 0),
      ];
      const vLines = [
        createDummyLine(true, 1000),
        createDummyLine(false, 0),
      ];
      const triggerTimestamps: number[][] = [];

      const result = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        1000,
        triggerTimestamps,
        600,
      );

      // Piece (0, 0) has both bottom and right edges moving -> 2 edges!
      expect(result.activationGrid[0][0]).toBe(1.0);

      // Piece (2, 2) has top = hLines[1] (false), left = vLines[1] (false) -> 0 edges moving
      expect(result.activationGrid[2][2]).toBe(0.0);
    });

    it("smoothly fades out activation over fadeDurationMs", () => {
      // Prior trigger at timestamp 1000 with fadeDuration 2000ms
      const hLines = [createDummyLine(false, 0)];
      const vLines = [createDummyLine(false, 0)];
      const priorTriggers = [[1000, -999999]];

      // Current time is 1500 (elapsed 500ms / 2000ms = 0.25 faded, 0.75 remaining)
      const midResult = updatePieceActivations(
        1,
        2,
        hLines,
        vLines,
        1500,
        2000,
        priorTriggers,
        600,
      );

      expect(midResult.activationGrid[0][0]).toBeCloseTo(0.75, 2);

      // Current time is 3000 (elapsed 2000ms >= fadeDuration) -> fully faded back to 0
      const endResult = updatePieceActivations(
        1,
        2,
        hLines,
        vLines,
        3000,
        2000,
        priorTriggers,
        600,
      );

      expect(endResult.activationGrid[0][0]).toBe(0.0);
    });
  });
});
