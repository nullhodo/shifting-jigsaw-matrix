import { describe, expect, it } from "vitest";
import {
  calculateConstrainedPuzzleDimensions,
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

  it("handles different tab styles gracefully", () => {
    const styles: TabShapeStyle[] = [
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
});
