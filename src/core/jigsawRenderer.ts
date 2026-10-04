import type p5 from "p5";
import { PRESET_COLOR_PALETTES } from "../constants/palettes";
import type { BoundaryLine, JigsawParameters } from "../types/jigsaw";
import {
  calculateConstrainedPuzzleDimensions,
  getJigsawTabGeometry,
  renderJigsawEdgeSegment,
  traceJigsawTabClosedPath,
} from "./geometry";
import { interpolateHexColor } from "./reactiveColoring";

/**
 * グリッドのセル固定色を初期化（隣接セルと色が被らないように選択）
 */
export function initializeJigsawGrid(
  columnsCount: number,
  rowsCount: number,
  paletteColors: string[],
): string[][] {
  const colors =
    paletteColors.length > 0
      ? paletteColors
      : ["#CC2132", "#E6692A", "#ED9530", "#34685C", "#1E404F"];

  const pieceFixedColorGrid: string[][] = [];
  for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
    pieceFixedColorGrid[rowIndex] = [];
    for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
      const topColor =
        rowIndex > 0
          ? pieceFixedColorGrid[rowIndex - 1][columnIndex]
          : null;
      const leftColor =
        columnIndex > 0
          ? pieceFixedColorGrid[rowIndex][columnIndex - 1]
          : null;

      let available = colors.filter(
        (color) => color !== topColor && color !== leftColor,
      );
      if (available.length === 0) {
        available = colors.filter((color) => color !== leftColor);
      }
      if (available.length === 0) {
        available = colors;
      }

      const picked =
        available[Math.floor(Math.random() * available.length)];
      pieceFixedColorGrid[rowIndex][columnIndex] = picked;
    }
  }
  return pieceFixedColorGrid;
}

/**
 * 水平・垂直境界線の進行方向・タブ方向を初期化
 */
export function initializeBoundaryLines(
  columnsCount: number,
  rowsCount: number,
): {
  horizontalBoundaryLines: BoundaryLine[];
  verticalBoundaryLines: BoundaryLine[];
} {
  const horizontalBoundaryLines: BoundaryLine[] = [];
  for (let hIdx = 0; hIdx < rowsCount - 1; hIdx++) {
    const tabDirections: number[] = [];
    const segmentCount = columnsCount + 10;
    for (let segIdx = 0; segIdx < segmentCount; segIdx++) {
      tabDirections.push((segIdx + hIdx) % 2 === 0 ? 1 : -1);
    }
    horizontalBoundaryLines.push({
      defaultDirection: hIdx % 2 === 0 ? 1 : -1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections,
    });
  }

  const verticalBoundaryLines: BoundaryLine[] = [];
  for (let vIdx = 0; vIdx < columnsCount - 1; vIdx++) {
    const tabDirections: number[] = [];
    const segmentCount = rowsCount + 10;
    for (let segIdx = 0; segIdx < segmentCount; segIdx++) {
      tabDirections.push((segIdx + vIdx) % 2 === 0 ? 1 : -1);
    }
    verticalBoundaryLines.push({
      defaultDirection: vIdx % 2 === 0 ? 1 : -1,
      currentStepUnit: 0,
      previousStepUnit: 0,
      targetStepUnit: 0,
      shiftOffset: 0,
      isTransitioning: false,
      transitionStartTimestamp: 0,
      tabDirections,
    });
  }

  return { horizontalBoundaryLines, verticalBoundaryLines };
}

/**
 * ざらつき（グレイン）用のノイズタイルバッファを生成（または既存バッファを更新）する関数
 */
export function generateGrainNoiseTexture(
  p5Instance: p5,
  intensity = 0.14,
  existingBuffer?: p5.Graphics | null,
): p5.Graphics {
  const textureTileSize = 512;
  const grainBuffer =
    existingBuffer &&
    existingBuffer.width === textureTileSize &&
    existingBuffer.height === textureTileSize
      ? existingBuffer
      : p5Instance.createGraphics(textureTileSize, textureTileSize);

  grainBuffer.pixelDensity(1);
  grainBuffer.loadPixels();

  const intensityMultiplier = Math.floor(intensity * 255);
  const totalPixelsLength = textureTileSize * textureTileSize * 4;

  for (let i = 0; i < totalPixelsLength; i += 4) {
    const noiseValue = Math.floor(
      (Math.random() - 0.5) * intensityMultiplier,
    );
    const channelValue = noiseValue > 0 ? 255 : 0;
    const alphaValue = Math.min(255, Math.abs(noiseValue) * 2);

    grainBuffer.pixels[i] = channelValue;
    grainBuffer.pixels[i + 1] = channelValue;
    grainBuffer.pixels[i + 2] = channelValue;
    grainBuffer.pixels[i + 3] = alphaValue;
  }

  grainBuffer.updatePixels();
  return grainBuffer;
}

/**
 * p5.Graphics の安全なリソース解放ヘルパー
 * (p5.js の一部バージョンで内部 _elements が参照できず indexOf 例外が発生する不具合を防止)
 */
export function safelyDisposeGraphics(
  graphics: p5.Graphics | null | undefined,
): void {
  if (!graphics) return;
  try {
    if (typeof graphics.remove === "function") {
      graphics.remove();
    }
  } catch {
    // p5.js internal remove error ignored
  }
}

/**
 * 四角ごとのfill描画、出っ張りタブの根本色マッピング（切れ目で2色分割）、
 * および一体化した境界線を描画するメイン描画関数
 */
export function renderCompleteJigsawPuzzle(
  rendererTarget: p5.Graphics | p5,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
  params: JigsawParameters,
  pieceFixedColorGrid: string[][],
  horizontalBoundaryLines: BoundaryLine[],
  verticalBoundaryLines: BoundaryLine[],
  grainBuffer: p5.Graphics | null = null,
  isExportMode = false,
  pieceActivationGrid?: number[][],
): void {
  if (
    !rendererTarget ||
    canvasDisplayWidth <= 10 ||
    canvasDisplayHeight <= 10
  ) {
    return;
  }

  const columnsCount = params.columns;
  const rowsCount = params.rows;

  const layoutBounds = calculateConstrainedPuzzleDimensions(
    canvasDisplayWidth,
    canvasDisplayHeight,
  );
  const { gridLeft, gridTop, availableWidth, availableHeight } =
    layoutBounds;

  const singleCellWidth = availableWidth / columnsCount;
  const singleCellHeight = availableHeight / rowsCount;

  // ピースおよび出っ張りタブの色を一元解決するヘルパー
  const paletteColors = params.activeColorPalette;
  const getPieceColorAt = (r: number, c: number): string => {
    if (params.reactiveFadeMode && pieceActivationGrid) {
      const activation = pieceActivationGrid[r]?.[c] ?? 0;
      const baseColor =
        params.reactiveBaseColorHex ||
        params.singlePieceColorHex ||
        "#1e293b";
      const targetColor =
        pieceFixedColorGrid[r]?.[c] ||
        paletteColors[(r * columnsCount + c) % paletteColors.length] ||
        "#38bdf8";
      return interpolateHexColor(baseColor, targetColor, activation);
    }
    if (params.monochromeFillActive) {
      return params.singlePieceColorHex;
    }
    return (
      pieceFixedColorGrid[r]?.[c] ||
      paletteColors[(r * columnsCount + c) % paletteColors.length] ||
      "#38bdf8"
    );
  };

  // 1. 全体背景描画
  rendererTarget.background(params.backgroundColorHex || "#090d16");

  // 2. 四角形セルごとの単色塗りつぶし
  rendererTarget.noStroke();
  for (let r = 0; r < rowsCount; r++) {
    for (let c = 0; c < columnsCount; c++) {
      rendererTarget.fill(getPieceColorAt(r, c));
      const cellOriginX = gridLeft + c * singleCellWidth;
      const cellOriginY = gridTop + r * singleCellHeight;
      rendererTarget.rect(
        cellOriginX,
        cellOriginY,
        singleCellWidth + 0.6,
        singleCellHeight + 0.6,
      );
    }
  }

  // 3. パズル領域クリップ内で出っ張り部分の根本色塗りつぶし & 境界線ストローク描画
  const context2D =
    rendererTarget.drawingContext as CanvasRenderingContext2D;
  const strokeScaleFactor = isExportMode
    ? canvasDisplayWidth / (window.innerWidth || 800)
    : 1.0;

  context2D.save();
  context2D.beginPath();
  context2D.rect(gridLeft, gridTop, availableWidth, availableHeight);
  context2D.clip();

  // 3-A. 水平境界線の出っ張りタブの塗りつぶし
  for (let hIdx = 0; hIdx < rowsCount - 1; hIdx++) {
    const boundaryLine = horizontalBoundaryLines[hIdx];
    if (!boundaryLine) continue;
    const linePositionY = gridTop + (hIdx + 1) * singleCellHeight;
    const currentShift =
      boundaryLine.currentStepUnit !== undefined
        ? boundaryLine.currentStepUnit * singleCellWidth
        : boundaryLine.shiftOffset || 0;

    const minSeg = Math.floor(-currentShift / singleCellWidth) - 2;
    const maxSeg =
      Math.ceil((availableWidth - currentShift) / singleCellWidth) + 2;

    for (let seg = minSeg; seg <= maxSeg; seg++) {
      const segStartX = gridLeft + seg * singleCellWidth + currentShift;
      const segEndX = segStartX + singleCellWidth;

      const tabList = boundaryLine.tabDirections || [1];
      const lookupIndex =
        ((seg % tabList.length) + tabList.length) % tabList.length;
      const tabDirection = tabList[lookupIndex] || 1;

      const geometry = getJigsawTabGeometry(
        segStartX,
        linePositionY,
        segEndX,
        linePositionY,
        tabDirection,
        params.tabShapeStyle,
        params.tabSizeFactor,
        params.tabRoundness,
        0.5,
      );
      if (!geometry) continue;

      const rootRow = geometry.tabHeight > 0 ? hIdx : hIdx + 1;
      if (rootRow < 0 || rootRow >= rowsCount) continue;

      const tabMinX = Math.min(
        geometry.basePointLeftX,
        geometry.basePointRightX,
        geometry.pHeadLeftX,
        geometry.pHeadRightX,
      );
      const tabMaxX = Math.max(
        geometry.basePointLeftX,
        geometry.basePointRightX,
        geometry.pHeadLeftX,
        geometry.pHeadRightX,
      );

      const startCol = Math.max(
        0,
        Math.floor((tabMinX - gridLeft) / singleCellWidth),
      );
      const endCol = Math.min(
        columnsCount - 1,
        Math.floor((tabMaxX - gridLeft) / singleCellWidth),
      );

      if (startCol === endCol) {
        const cellColor = getPieceColorAt(rootRow, startCol);
        context2D.fillStyle = cellColor;
        traceJigsawTabClosedPath(context2D, geometry);
        context2D.fill();
      } else if (startCol < endCol) {
        context2D.save();
        traceJigsawTabClosedPath(context2D, geometry);
        context2D.clip();

        const tabMinY =
          Math.min(geometry.basePointLeftY, geometry.tabCenterY) - 5;
        const tabHeightTotal = Math.abs(geometry.tabHeight) + 10;

        for (let col = startCol; col <= endCol; col++) {
          const colStartX = gridLeft + col * singleCellWidth;
          const cellColor = getPieceColorAt(rootRow, col);
          context2D.fillStyle = cellColor;
          context2D.fillRect(
            colStartX,
            tabMinY,
            singleCellWidth + 0.6,
            tabHeightTotal,
          );
        }
        context2D.restore();
      }
    }
  }

  // 3-B. 垂直境界線の出っ張りタブの塗りつぶし
  for (let vIdx = 0; vIdx < columnsCount - 1; vIdx++) {
    const boundaryLine = verticalBoundaryLines[vIdx];
    if (!boundaryLine) continue;
    const linePositionX = gridLeft + (vIdx + 1) * singleCellWidth;
    const currentShift =
      boundaryLine.currentStepUnit !== undefined
        ? boundaryLine.currentStepUnit * singleCellHeight
        : boundaryLine.shiftOffset || 0;

    const minSeg = Math.floor(-currentShift / singleCellHeight) - 2;
    const maxSeg =
      Math.ceil((availableHeight - currentShift) / singleCellHeight) + 2;

    for (let seg = minSeg; seg <= maxSeg; seg++) {
      const segStartY = gridTop + seg * singleCellHeight + currentShift;
      const segEndY = segStartY + singleCellHeight;

      const tabList = boundaryLine.tabDirections || [1];
      const lookupIndex =
        ((seg % tabList.length) + tabList.length) % tabList.length;
      const tabDirection = tabList[lookupIndex] || 1;

      const geometry = getJigsawTabGeometry(
        linePositionX,
        segStartY,
        linePositionX,
        segEndY,
        tabDirection,
        params.tabShapeStyle,
        params.tabSizeFactor,
        params.tabRoundness,
        0.5,
      );
      if (!geometry) continue;

      const rootCol = tabDirection > 0 ? vIdx + 1 : vIdx;
      if (rootCol < 0 || rootCol >= columnsCount) continue;

      const tabMinY = Math.min(
        geometry.basePointLeftY,
        geometry.basePointRightY,
        geometry.pHeadLeftY,
        geometry.pHeadRightY,
      );
      const tabMaxY = Math.max(
        geometry.basePointLeftY,
        geometry.basePointRightY,
        geometry.pHeadLeftY,
        geometry.pHeadRightY,
      );

      const startRow = Math.max(
        0,
        Math.floor((tabMinY - gridTop) / singleCellHeight),
      );
      const endRow = Math.min(
        rowsCount - 1,
        Math.floor((tabMaxY - gridTop) / singleCellHeight),
      );

      if (startRow === endRow) {
        const cellColor = getPieceColorAt(startRow, rootCol);
        context2D.fillStyle = cellColor;
        traceJigsawTabClosedPath(context2D, geometry);
        context2D.fill();
      } else if (startRow < endRow) {
        context2D.save();
        traceJigsawTabClosedPath(context2D, geometry);
        context2D.clip();

        const tabMinX =
          Math.min(geometry.basePointLeftX, geometry.tabCenterX) - 5;
        const tabWidthTotal = Math.abs(geometry.tabHeight) + 10;

        for (let row = startRow; row <= endRow; row++) {
          const rowStartY = gridTop + row * singleCellHeight;
          const cellColor = getPieceColorAt(row, rootCol);
          context2D.fillStyle = cellColor;
          context2D.fillRect(
            tabMinX,
            rowStartY,
            tabWidthTotal,
            singleCellHeight + 0.6,
          );
        }
        context2D.restore();
      }
    }
  }

  // 3-C. 行・列の一体化したジグソー境界線（ストローク輪郭）の描画
  rendererTarget.stroke(params.strokeColorHex || "#0f172a");
  rendererTarget.strokeWeight(params.strokeWidth * strokeScaleFactor);
  rendererTarget.noFill();

  // 水平境界線 (X軸方向へのステップ移動)
  for (let hIdx = 0; hIdx < rowsCount - 1; hIdx++) {
    const boundaryLine = horizontalBoundaryLines[hIdx];
    if (!boundaryLine) continue;
    const linePositionY = gridTop + (hIdx + 1) * singleCellHeight;
    const currentShift =
      boundaryLine.currentStepUnit !== undefined
        ? boundaryLine.currentStepUnit * singleCellWidth
        : boundaryLine.shiftOffset || 0;

    const minSeg = Math.floor(-currentShift / singleCellWidth) - 2;
    const maxSeg =
      Math.ceil((availableWidth - currentShift) / singleCellWidth) + 2;

    rendererTarget.beginShape();
    const startX = gridLeft + minSeg * singleCellWidth + currentShift;
    rendererTarget.vertex(startX, linePositionY);

    for (let seg = minSeg; seg <= maxSeg; seg++) {
      const segStartX = gridLeft + seg * singleCellWidth + currentShift;
      const segEndX = segStartX + singleCellWidth;

      const tabList = boundaryLine.tabDirections || [1];
      const lookupIndex =
        ((seg % tabList.length) + tabList.length) % tabList.length;
      const tabDirection = tabList[lookupIndex] || 1;

      const geometry = getJigsawTabGeometry(
        segStartX,
        linePositionY,
        segEndX,
        linePositionY,
        tabDirection,
        params.tabShapeStyle,
        params.tabSizeFactor,
        params.tabRoundness,
        0.5,
      );
      if (geometry) {
        renderJigsawEdgeSegment(
          rendererTarget,
          geometry,
          segEndX,
          linePositionY,
        );
      }
    }
    rendererTarget.endShape();
  }

  // 垂直境界線 (Y軸方向へのステップ移動)
  for (let vIdx = 0; vIdx < columnsCount - 1; vIdx++) {
    const boundaryLine = verticalBoundaryLines[vIdx];
    if (!boundaryLine) continue;
    const linePositionX = gridLeft + (vIdx + 1) * singleCellWidth;
    const currentShift =
      boundaryLine.currentStepUnit !== undefined
        ? boundaryLine.currentStepUnit * singleCellHeight
        : boundaryLine.shiftOffset || 0;

    const minSeg = Math.floor(-currentShift / singleCellHeight) - 2;
    const maxSeg =
      Math.ceil((availableHeight - currentShift) / singleCellHeight) + 2;

    rendererTarget.beginShape();
    const startY = gridTop + minSeg * singleCellHeight + currentShift;
    rendererTarget.vertex(linePositionX, startY);

    for (let seg = minSeg; seg <= maxSeg; seg++) {
      const segStartY = gridTop + seg * singleCellHeight + currentShift;
      const segEndY = segStartY + singleCellHeight;

      const tabList = boundaryLine.tabDirections || [1];
      const lookupIndex =
        ((seg % tabList.length) + tabList.length) % tabList.length;
      const tabDirection = tabList[lookupIndex] || 1;

      const geometry = getJigsawTabGeometry(
        linePositionX,
        segStartY,
        linePositionX,
        segEndY,
        tabDirection,
        params.tabShapeStyle,
        params.tabSizeFactor,
        params.tabRoundness,
        0.5,
      );
      if (geometry) {
        renderJigsawEdgeSegment(
          rendererTarget,
          geometry,
          linePositionX,
          segEndY,
        );
      }
    }
    rendererTarget.endShape();
  }

  context2D.restore();

  // 4. 外周枠線
  rendererTarget.stroke(params.strokeColorHex || "#0f172a");
  rendererTarget.strokeWeight(
    params.strokeWidth * 1.5 * strokeScaleFactor,
  );
  rendererTarget.noFill();
  rendererTarget.rect(gridLeft, gridTop, availableWidth, availableHeight);

  // 5. ざらついた質感(グレイン)のタイリング
  if (params.grainActive && grainBuffer) {
    context2D.save();
    context2D.globalAlpha = 1.0;
    const tileSize = grainBuffer.width;
    for (let tileX = 0; tileX < canvasDisplayWidth; tileX += tileSize) {
      for (let tileY = 0; tileY < canvasDisplayHeight; tileY += tileSize) {
        // @ts-expect-error canvas property exists on p5.Graphics
        context2D.drawImage(grainBuffer.canvas, tileX, tileY);
      }
    }
    context2D.restore();
  }

  // 6. デバッグ表示
  if (params.debugModeActive && !isExportMode) {
    renderDebugOverlayInformation(
      rendererTarget,
      canvasDisplayWidth,
      canvasDisplayHeight,
      params,
    );
  }
}

/**
 * デバッグモード時の情報表示オーバーレイ
 */
export function renderDebugOverlayInformation(
  rendererTarget: p5.Graphics | p5,
  canvasWidth: number,
  canvasHeight: number,
  params: JigsawParameters,
): void {
  rendererTarget.push();
  rendererTarget.resetMatrix();
  rendererTarget.fill(15, 23, 42, 210);
  rendererTarget.stroke(56, 189, 248);
  rendererTarget.strokeWeight(1);
  rendererTarget.rect(20, canvasHeight - 170, 340, 150, 8);

  rendererTarget.noStroke();
  rendererTarget.fill(241, 245, 249);
  rendererTarget.textSize(11);
  rendererTarget.textAlign(rendererTarget.LEFT, rendererTarget.TOP);

  const fpsValue = Math.round(
    typeof rendererTarget.frameRate === "function"
      ? rendererTarget.frameRate()
      : 60,
  );
  rendererTarget.text("=== DEBUG STATUS ===", 30, canvasHeight - 160);
  rendererTarget.text(
    `Frame Rate: ${fpsValue} FPS`,
    30,
    canvasHeight - 142,
  );
  rendererTarget.text(
    `Resolution: ${canvasWidth} × ${canvasHeight}`,
    30,
    canvasHeight - 126,
  );
  rendererTarget.text(
    `Matrix: ${params.columns} Cols × ${params.rows} Rows`,
    30,
    canvasHeight - 110,
  );
  rendererTarget.text(
    `Active Motion Prob: ${Math.round(params.motionProbability * 100)}%`,
    30,
    canvasHeight - 94,
  );
  rendererTarget.text(
    `Step Interval: ${params.stepIntervalMilliseconds}ms (Ease: ${params.easingDurationMilliseconds}ms)`,
    30,
    canvasHeight - 78,
  );
  rendererTarget.text(
    `Palette: ${PRESET_COLOR_PALETTES[params.currentPaletteIndex]?.title || "Custom"}`,
    30,
    canvasHeight - 62,
  );
  rendererTarget.pop();
}
