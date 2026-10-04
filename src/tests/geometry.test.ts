import { describe, expect, it } from "vitest";
import {
  calculateBalancedGridDimensions,
  calculateConstrainedPuzzleDimensions,
  calculateOptimalGridDimensions,
  getJigsawTabGeometry,
} from "../core/geometry";
import type { TabShapeStyle } from "../types/jigsaw";

describe("geometry calculations", () => {
  it("computes tab geometry for classic style with valid bezier points", () => {
    const geo = getJigsawTabGeometry(
      0,
      0,
      100,
      0,
      1,
      "classic",
      0.16,
      0.28,
      0.5,
    );
    expect(geo).not.toBeNull();
    if (!geo) return;

    expect(geo.tabHeight).toBeCloseTo(16, 1);
    expect(geo.tabCenterX).toBeCloseTo(50, 1);
    expect(geo.tabCenterY).toBeCloseTo(16, 1);

    // Points should be symmetric across center X = 50
    expect(geo.basePointLeftX).toBeLessThan(50);
    expect(geo.basePointRightX).toBeGreaterThan(50);
    expect(50 - geo.basePointLeftX).toBeCloseTo(
      geo.basePointRightX - 50,
      3,
    );
  });

  it("computes tab geometry for circular style with deep bite, waist neck and differentiable horizontal tangents", () => {
    const geo = getJigsawTabGeometry(
      0,
      0,
      100,
      0,
      1,
      "circular",
      0.16,
      0.28,
      0.5,
    );
    expect(geo).not.toBeNull();
    if (!geo) return;

    // Deep bite tab height (around 22px for 100px segment with 0.16 depth)
    expect(geo.tabHeight).toBeCloseTo(22.0, 1);
    expect(geo.tabCenterX).toBeCloseTo(50, 1);
    expect(geo.tabCenterY).toBeCloseTo(22.0, 1);

    // Differentiable with baseline (cp1Y == basePointLeftY, cp6Y == basePointRightY)
    expect(geo.cp1Y).toBeCloseTo(geo.basePointLeftY, 5);
    expect(geo.cp6Y).toBeCloseTo(geo.basePointRightY, 5);

    // Tangents point strictly inwards into the tab along the baseline
    expect(geo.cp1X).toBeGreaterThan(geo.basePointLeftX);
    expect(geo.cp6X).toBeLessThan(geo.basePointRightX);

    // Waist neck is narrower than head width (forming a distinct bridge)
    const waistHalfWidth = Math.abs(geo.cp2X - 50);
    const headHalfWidth = Math.abs(geo.pHeadLeftX - 50);
    expect(waistHalfWidth).toBeLessThan(headHalfWidth);

    // Points should be symmetric across center X = 50
    expect(50 - geo.basePointLeftX).toBeCloseTo(
      geo.basePointRightX - 50,
      3,
    );
    expect(50 - geo.pHeadLeftX).toBeCloseTo(geo.pHeadRightX - 50, 3);
    expect(50 - geo.cp2X).toBeCloseTo(geo.cp5X - 50, 3);
  });

  it("handles different tab styles gracefully", () => {
    const styles: TabShapeStyle[] = [
      "circular",
      "classic",
      "bulb",
      "sharp",
      "trapezoid",
      "gentle",
    ];
    for (const style of styles) {
      const geo = getJigsawTabGeometry(
        10,
        20,
        110,
        20,
        -1,
        style,
        0.2,
        0.3,
        0.5,
      );
      expect(geo).not.toBeNull();
      expect(geo?.tabHeight).toBeLessThan(0); // orientation -1
    }
  });

  it("returns null for degenerate segments (length ~ 0)", () => {
    const geo = getJigsawTabGeometry(50, 50, 50, 50, 1);
    expect(geo).toBeNull();
  });

  it("constrains aspect ratio properly between 0.65 and 1.55", () => {
    // Ultra wide display
    const wideBounds = calculateConstrainedPuzzleDimensions(3000, 1000);
    const wideRatio =
      wideBounds.availableWidth / wideBounds.availableHeight;
    expect(wideRatio).toBeLessThanOrEqual(1.55 + 0.01);

    // Ultra tall display
    const tallBounds = calculateConstrainedPuzzleDimensions(500, 2000);
    const tallRatio =
      tallBounds.availableWidth / tallBounds.availableHeight;
    expect(tallRatio).toBeGreaterThanOrEqual(0.65 - 0.01);
  });

  it("ensures tab centers remain centered on cell columns after integer step shifts", () => {
    const bounds = calculateConstrainedPuzzleDimensions(1024, 624);
    const cols = 6;
    const cellW = bounds.availableWidth / cols;

    for (let step = -3; step <= 3; step++) {
      const shift = step * cellW;
      for (let seg = -2; seg < cols + 2; seg++) {
        const segStartX = bounds.gridLeft + seg * cellW + shift;
        const segEndX = segStartX + cellW;
        const tabGeo = getJigsawTabGeometry(
          segStartX,
          100,
          segEndX,
          100,
          1,
          "classic",
          0.16,
          0.28,
          0.5,
        );
        expect(tabGeo).not.toBeNull();
        if (tabGeo) {
          // Tab center X should always be gridLeft + (integer + 0.5) * cellW
          const normalizedCenter =
            (tabGeo.tabCenterX - bounds.gridLeft) / cellW;
          const fractionalPart = Math.abs(
            normalizedCenter - Math.round(normalizedCenter),
          );
          expect(fractionalPart).toBeCloseTo(0.5, 4);
        }
      }
    }
  });

  it("calculates optimal grid dimensions that produce near 1:1 piece aspect ratio", () => {
    // 16:9 widescreen display (1920x1080)
    const wide = calculateOptimalGridDimensions(1920, 1080);
    const wideBounds = calculateConstrainedPuzzleDimensions(1920, 1080);
    const widePieceAspect =
      wideBounds.availableWidth /
      wide.columns /
      (wideBounds.availableHeight / wide.rows);
    expect(widePieceAspect).toBeGreaterThanOrEqual(0.85);
    expect(widePieceAspect).toBeLessThanOrEqual(1.2);

    // Square display (800x800)
    const square = calculateOptimalGridDimensions(800, 800);
    expect(square.columns).toBe(square.rows);

    // Portrait display (400x800)
    const portrait = calculateOptimalGridDimensions(400, 800);
    const portraitBounds = calculateConstrainedPuzzleDimensions(400, 800);
    const portraitPieceAspect =
      portraitBounds.availableWidth /
      portrait.columns /
      (portraitBounds.availableHeight / portrait.rows);
    expect(portraitPieceAspect).toBeGreaterThanOrEqual(0.8);
    expect(portraitPieceAspect).toBeLessThanOrEqual(1.25);
  });

  it("calculates balanced grid dimensions when linking columns and rows", () => {
    // Fix columns = 8 on 1920x1080 (clamped aspect = 1.55)
    const fromCols = calculateBalancedGridDimensions(1920, 1080, {
      type: "columns",
      value: 8,
    });
    expect(fromCols.columns).toBe(8);
    expect(fromCols.rows).toBe(5); // Math.round(8 / 1.55) = 5

    // Fix rows = 4 on 1920x1080
    const fromRows = calculateBalancedGridDimensions(1920, 1080, {
      type: "rows",
      value: 4,
    });
    expect(fromRows.rows).toBe(4);
    expect(fromRows.columns).toBe(6); // Math.round(4 * 1.55) = 6
  });
});
