import type p5 from "p5";
import type { BoundaryLine, JigsawParameters } from "../types/jigsaw";
import { getFormattedDate } from "../utils/date";
import {
  generateGrainNoiseTexture,
  renderCompleteJigsawPuzzle,
} from "./jigsawRenderer";

export interface JigsawConfigFile {
  version: string;
  title: string;
  exportedAt: string;
  formattedTimestamp: string;
  parameters: JigsawParameters;
  colorGrid: string[][];
  boundaryLines: {
    horizontal: BoundaryLine[];
    vertical: BoundaryLine[];
  };
}

/**
 * 高解像度オフスクリーンバッファでレイアウトを崩さずに再描画し PNG と JSON を書き出す
 */
export function exportHighResolutionImageWithMetadata(
  p5Instance: p5,
  params: JigsawParameters,
  colorGrid: string[][],
  horizontalLines: BoundaryLine[],
  verticalLines: BoundaryLine[],
  exportDimension = 2880,
): void {
  const offscreenGraphics = p5Instance.createGraphics(
    exportDimension,
    exportDimension,
  );

  const grainBuffer = params.grainActive
    ? generateGrainNoiseTexture(p5Instance, params.grainIntensity)
    : null;

  renderCompleteJigsawPuzzle(
    offscreenGraphics,
    exportDimension,
    exportDimension,
    params,
    colorGrid,
    horizontalLines,
    verticalLines,
    grainBuffer,
    true,
  );

  const formattedTimestamp = getFormattedDate();
  const exportBaseFilename = `ShiftingJigsawMatrix_${formattedTimestamp}_${exportDimension}x${exportDimension}`;

  p5Instance.save(offscreenGraphics, `${exportBaseFilename}.png`);

  exportParameterStateJSON(
    params,
    colorGrid,
    horizontalLines,
    verticalLines,
    exportBaseFilename,
  );

  try {
    offscreenGraphics.remove();
    grainBuffer?.remove();
  } catch {
    // ignore
  }
}

/**
 * ベクター SVG の書き出し (p5.js-svg)
 */
export function exportSvgGraphics(
  p5Instance: p5,
  params: JigsawParameters,
  colorGrid: string[][],
  horizontalLines: BoundaryLine[],
  verticalLines: BoundaryLine[],
  exportDimension = 1920,
): void {
  const timestampString = getFormattedDate();
  const filenameBase = `ShiftingJigsawMatrix_${timestampString}_vector`;

  const p5WithSvg = p5Instance as unknown as {
    SVG: p5.RENDERER;
    createGraphics: (
      w: number,
      h: number,
      renderer?: p5.RENDERER,
    ) => p5.Graphics;
  };
  const svgGraphics = p5WithSvg.createGraphics(
    exportDimension,
    exportDimension,
    p5WithSvg.SVG,
  );

  renderCompleteJigsawPuzzle(
    svgGraphics,
    exportDimension,
    exportDimension,
    params,
    colorGrid,
    horizontalLines,
    verticalLines,
    null,
    true,
  );

  p5Instance.save(svgGraphics, `${filenameBase}.svg`);

  try {
    svgGraphics.remove();
  } catch {
    // ignore
  }
}

/**
 * パラメータや色情報を記録する JSON 設定ファイルを書き出す
 */
export function exportParameterStateJSON(
  params: JigsawParameters,
  colorGrid: string[][],
  horizontalLines: BoundaryLine[],
  verticalLines: BoundaryLine[],
  baseFileName?: string,
): void {
  const formattedTimestamp = getFormattedDate();
  const filename = baseFileName
    ? `${baseFileName}.json`
    : `ShiftingJigsawMatrix_${formattedTimestamp}.json`;

  const configData: JigsawConfigFile = {
    version: "1.0.0",
    title: "Shifting Jigsaw Matrix",
    exportedAt: new Date().toISOString(),
    formattedTimestamp,
    parameters: params,
    colorGrid,
    boundaryLines: {
      horizontal: horizontalLines,
      vertical: verticalLines,
    },
  };

  const jsonString = JSON.stringify(configData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);

  const linkElement = document.createElement("a");
  linkElement.href = downloadUrl;
  linkElement.download = filename;
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(downloadUrl);
}
