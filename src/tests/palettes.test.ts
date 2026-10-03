import { describe, expect, it } from "vitest";
import { PRESET_COLOR_PALETTES } from "../constants/palettes";
import { initializeJigsawGrid } from "../core/jigsawRenderer";

describe("palettes and grid color assignment", () => {
  it("contains valid color definitions in all preset palettes", () => {
    expect(PRESET_COLOR_PALETTES.length).toBeGreaterThan(10);

    for (const p of PRESET_COLOR_PALETTES) {
      expect(p.title).toBeTruthy();
      expect(p.colors.length).toBeGreaterThanOrEqual(3);
      for (const color of p.colors) {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.rgb).toHaveLength(3);
      }
    }
  });

  it("avoids same color between adjacent cells when multiple colors are available", () => {
    const palette = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
    ];
    const cols = 6;
    const rows = 6;

    const grid = initializeJigsawGrid(cols, rows, palette);
    expect(grid).toHaveLength(rows);
    expect(grid[0]).toHaveLength(cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = grid[r][c];
        if (r > 0) {
          expect(current).not.toBe(grid[r - 1][c]); // Top neighbour
        }
        if (c > 0) {
          expect(current).not.toBe(grid[r][c - 1]); // Left neighbour
        }
      }
    }
  });
});
