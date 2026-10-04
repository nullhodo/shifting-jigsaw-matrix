import { describe, expect, it } from "vitest";
import {
  initializeActivationGrid,
  initializePieceActivationStates,
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

  describe("initializePieceActivationStates", () => {
    it("generates an initial 2D state grid with inactive properties", () => {
      const states = initializePieceActivationStates(2, 3);
      expect(states.length).toBe(2);
      expect(states[0].length).toBe(3);
      expect(states[0][0].wasTwoEdgesActive).toBe(false);
      expect(states[0][0].currentActivation).toBe(0);
      expect(states[0][0].startActivation).toBe(0);
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
      const pieceStates = initializePieceActivationStates(3, 3);

      const result = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        400,
        1000,
        pieceStates,
        600,
      );

      for (const row of result.activationGrid) {
        expect(row.every((val) => val === 0)).toBe(true);
      }
    });

    it("activates on 1 edge movement when triggerEdges is 1, but ignores 1 edge movement when triggerEdges is 2", () => {
      // Piece at (0, 0) has only hLines[0] moving (1 edge moving)
      const hLines = [
        createDummyLine(true, 1000),
        createDummyLine(false, 0),
      ];
      const vLines = [
        createDummyLine(false, 0),
        createDummyLine(false, 0),
      ];

      // Test with triggerEdges = 2 (default): should NOT activate
      let statesTwoEdges = initializePieceActivationStates(3, 3);
      const startTwoEdges = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        400,
        1000,
        statesTwoEdges,
        600,
        2,
      );
      statesTwoEdges = startTwoEdges.updatedPieceStates;
      const resultTwoEdges = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1200,
        400,
        1000,
        statesTwoEdges,
        600,
        2,
      );
      expect(resultTwoEdges.activationGrid[0][0]).toBe(0.0);
      expect(resultTwoEdges.updatedPieceStates[0][0].wasActive).toBe(
        false,
      );

      // Test with triggerEdges = 1: SHOULD activate
      let statesOneEdge = initializePieceActivationStates(3, 3);
      const startOneEdge = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        400,
        1000,
        statesOneEdge,
        600,
        1,
      );
      statesOneEdge = startOneEdge.updatedPieceStates;
      expect(startOneEdge.activationGrid[0][0]).toBe(0.0);
      expect(startOneEdge.updatedPieceStates[0][0].wasActive).toBe(true);

      const resultOneEdge = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1200,
        400,
        1000,
        statesOneEdge,
        600,
        1,
      );
      // At t = 1200 (200ms elapsed out of 400ms fade-in), activation should be 0.5
      expect(resultOneEdge.activationGrid[0][0]).toBeCloseTo(0.5, 2);
      expect(resultOneEdge.updatedPieceStates[0][0].wasActive).toBe(true);
    });

    it("smoothly eases in activation when 2 edges start moving", () => {
      // 3 rows x 3 cols:
      // Piece at (0, 0) is surrounded by hLines[0] and vLines[0]
      const hLines = [
        createDummyLine(true, 1000),
        createDummyLine(false, 0),
      ];
      const vLines = [
        createDummyLine(true, 1000),
        createDummyLine(false, 0),
      ];
      let states = initializePieceActivationStates(3, 3);

      // At start (t = 1000): movement begins, activation starts at 0
      const startResult = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1000,
        400,
        1000,
        states,
        600,
      );
      states = startResult.updatedPieceStates;
      expect(startResult.activationGrid[0][0]).toBe(0.0);

      // Halfway through fade-in (t = 1200 with 400ms duration): cubic easing gives 0.5
      const midResult = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1200,
        400,
        1000,
        states,
        600,
      );
      states = midResult.updatedPieceStates;
      expect(midResult.activationGrid[0][0]).toBeCloseTo(0.5, 2);

      // Fade-in complete (t = 1400): reaches peak 1.0 smoothly
      const peakResult = updatePieceActivations(
        3,
        3,
        hLines,
        vLines,
        1400,
        400,
        1000,
        states,
        600,
      );
      expect(peakResult.activationGrid[0][0]).toBe(1.0);
    });

    it("smoothly fades out activation over fadeOutDurationMs after movement ends", () => {
      // Setup a state where piece was at peak activation 1.0 and motion just completed
      const hLines = [createDummyLine(false, 0)];
      const vLines = [createDummyLine(false, 0)];
      const states = [
        [
          {
            triggerStartTimestamp: 1000,
            startActivation: 1.0,
            currentActivation: 1.0,
            wasActive: true,
            wasTwoEdgesActive: true, // motion was active until now
          },
        ],
      ];

      // At t = 1000: motion stops, fade-out starts from 1.0
      const stopResult = updatePieceActivations(
        1,
        1,
        hLines,
        vLines,
        1000,
        400,
        2000,
        states,
        600,
      );
      let updatedStates = stopResult.updatedPieceStates;
      expect(stopResult.activationGrid[0][0]).toBe(1.0);

      // Halfway through fade-out (t = 2000, elapsed 1000ms / 2000ms): cubic easing gives 0.5
      const midResult = updatePieceActivations(
        1,
        1,
        hLines,
        vLines,
        2000,
        400,
        2000,
        updatedStates,
        600,
      );
      updatedStates = midResult.updatedPieceStates;
      expect(midResult.activationGrid[0][0]).toBeCloseTo(0.5, 2);

      // Fade-out complete (t = 3000, elapsed 2000ms): reaches 0.0
      const endResult = updatePieceActivations(
        1,
        1,
        hLines,
        vLines,
        3000,
        400,
        2000,
        updatedStates,
        600,
      );
      expect(endResult.activationGrid[0][0]).toBe(0.0);
    });
  });
});
