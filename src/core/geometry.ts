import type p5 from "p5";
import type {
  LayoutBounds,
  TabGeometry,
  TabShapeStyle,
} from "../types/jigsaw";

/**
 * ジグソータブ（出っ張り）の幾何ベジェ制御点を計算する純粋関数
 * パターン（Classic, Bulb, Sharp, Trapezoid, Gentle Wave）に応じた曲線計算を行う
 */
export function getJigsawTabGeometry(
  startCoordinateX: number,
  startCoordinateY: number,
  endCoordinateX: number,
  endCoordinateY: number,
  tabOrientation: number,
  tabStyle: TabShapeStyle = "classic",
  tabSizeFactor = 0.16,
  tabRoundness = 0.28,
  tabCenterFraction = 0.5,
): TabGeometry | null {
  const deltaX = endCoordinateX - startCoordinateX;
  const deltaY = endCoordinateY - startCoordinateY;
  const segmentLength = Math.hypot(deltaX, deltaY);
  if (segmentLength < 1e-4) return null;

  const unitTangentX = deltaX / segmentLength;
  const unitTangentY = deltaY / segmentLength;

  // 突起方向の法線ベクトル
  const normalX = -unitTangentY * tabOrientation;
  const normalY = unitTangentX * tabOrientation;

  const baseHeight = segmentLength * tabSizeFactor;
  const roundness = tabRoundness;

  let neckHalfWidth: number;
  let headHalfWidth: number;
  let neckBulgeFactor: number;
  let actualTabHeight = baseHeight;

  // スタイルごとの幾何パラメータ設定
  if (tabStyle === "bulb") {
    neckHalfWidth = segmentLength * (0.075 + (1 - roundness) * 0.03);
    headHalfWidth = segmentLength * (0.19 + roundness * 0.15);
    neckBulgeFactor = roundness * 0.7;
    actualTabHeight = baseHeight * 1.1;
  } else if (tabStyle === "sharp") {
    neckHalfWidth = segmentLength * 0.13;
    headHalfWidth = segmentLength * (0.11 + roundness * 0.05);
    neckBulgeFactor = -0.15 * (1 - roundness);
    actualTabHeight = baseHeight * 1.15;
  } else if (tabStyle === "trapezoid") {
    neckHalfWidth = segmentLength * 0.15;
    headHalfWidth = segmentLength * (0.17 + roundness * 0.04);
    neckBulgeFactor = 0.05;
    actualTabHeight = baseHeight * 0.95;
  } else if (tabStyle === "gentle") {
    neckHalfWidth = segmentLength * (0.24 + roundness * 0.06);
    headHalfWidth = segmentLength * (0.11 + roundness * 0.06);
    neckBulgeFactor = 0.1;
    actualTabHeight = baseHeight * 0.85;
  } else {
    // classic
    neckHalfWidth = segmentLength * 0.12;
    headHalfWidth = segmentLength * (0.16 + roundness * 0.12);
    neckBulgeFactor = roundness * 0.5;
  }

  const centerX = startCoordinateX + deltaX * tabCenterFraction;
  const centerY = startCoordinateY + deltaY * tabCenterFraction;

  const basePointLeftX = centerX - unitTangentX * neckHalfWidth;
  const basePointLeftY = centerY - unitTangentY * neckHalfWidth;
  const basePointRightX = centerX + unitTangentX * neckHalfWidth;
  const basePointRightY = centerY + unitTangentY * neckHalfWidth;

  const tabApexX = centerX + normalX * actualTabHeight;
  const tabApexY = centerY + normalY * actualTabHeight;

  const pHeadLeftX = tabApexX - unitTangentX * headHalfWidth;
  const pHeadLeftY = tabApexY - unitTangentY * headHalfWidth;
  const pHeadRightX = tabApexX + unitTangentX * headHalfWidth;
  const pHeadRightY = tabApexY + unitTangentY * headHalfWidth;

  let cp1X: number;
  let cp1Y: number;
  let cp2X: number;
  let cp2Y: number;
  let cp3X: number;
  let cp3Y: number;
  let cp4X: number;
  let cp4Y: number;
  let cp5X: number;
  let cp5Y: number;
  let cp6X: number;
  let cp6Y: number;

  if (tabStyle === "trapezoid") {
    const cornerRounding = actualTabHeight * (0.15 + roundness * 0.2);
    cp1X =
      basePointLeftX - unitTangentX * (neckHalfWidth * neckBulgeFactor);
    cp1Y =
      basePointLeftY - unitTangentY * (neckHalfWidth * neckBulgeFactor);
    cp2X = pHeadLeftX - normalX * (actualTabHeight * 0.45);
    cp2Y = pHeadLeftY - normalY * (actualTabHeight * 0.45);

    cp3X = pHeadLeftX + normalX * cornerRounding;
    cp3Y = pHeadLeftY + normalY * cornerRounding;
    cp4X = pHeadRightX + normalX * cornerRounding;
    cp4Y = pHeadRightY + normalY * cornerRounding;

    cp5X = pHeadRightX - normalX * (actualTabHeight * 0.45);
    cp5Y = pHeadRightY - normalY * (actualTabHeight * 0.45);
    cp6X =
      basePointRightX + unitTangentX * (neckHalfWidth * neckBulgeFactor);
    cp6Y =
      basePointRightY + unitTangentY * (neckHalfWidth * neckBulgeFactor);
  } else if (tabStyle === "sharp") {
    cp1X = basePointLeftX;
    cp1Y = basePointLeftY;
    cp2X = pHeadLeftX - normalX * (actualTabHeight * 0.15);
    cp2Y = pHeadLeftY - normalY * (actualTabHeight * 0.15);

    cp3X =
      tabApexX -
      unitTangentX * (headHalfWidth * 0.3) +
      normalX * (actualTabHeight * 0.05);
    cp3Y =
      tabApexY -
      unitTangentY * (headHalfWidth * 0.3) +
      normalY * (actualTabHeight * 0.05);
    cp4X =
      tabApexX +
      unitTangentX * (headHalfWidth * 0.3) +
      normalX * (actualTabHeight * 0.05);
    cp4Y =
      tabApexY +
      unitTangentY * (headHalfWidth * 0.3) +
      normalY * (actualTabHeight * 0.05);

    cp5X = pHeadRightX - normalX * (actualTabHeight * 0.15);
    cp5Y = pHeadRightY - normalY * (actualTabHeight * 0.15);
    cp6X = basePointRightX;
    cp6Y = basePointRightY;
  } else if (tabStyle === "gentle") {
    cp1X = basePointLeftX + unitTangentX * (neckHalfWidth * 0.2);
    cp1Y = basePointLeftY + unitTangentY * (neckHalfWidth * 0.2);
    cp2X =
      pHeadLeftX -
      unitTangentX * (headHalfWidth * 0.5) -
      normalX * (actualTabHeight * 0.2);
    cp2Y =
      pHeadLeftY -
      unitTangentY * (headHalfWidth * 0.5) -
      normalY * (actualTabHeight * 0.2);

    cp3X = pHeadLeftX + normalX * (actualTabHeight * 0.35);
    cp3Y = pHeadLeftY + normalY * (actualTabHeight * 0.35);
    cp4X = pHeadRightX + normalX * (actualTabHeight * 0.35);
    cp4Y = pHeadRightY + normalY * (actualTabHeight * 0.35);

    cp5X =
      pHeadRightX +
      unitTangentX * (headHalfWidth * 0.5) -
      normalX * (actualTabHeight * 0.2);
    cp5Y =
      pHeadRightY +
      unitTangentY * (headHalfWidth * 0.5) -
      normalY * (actualTabHeight * 0.2);
    cp6X = basePointRightX - unitTangentX * (neckHalfWidth * 0.2);
    cp6Y = basePointRightY - unitTangentY * (neckHalfWidth * 0.2);
  } else {
    // Classic & Bulb
    cp1X =
      basePointLeftX - unitTangentX * (neckHalfWidth * neckBulgeFactor);
    cp1Y =
      basePointLeftY - unitTangentY * (neckHalfWidth * neckBulgeFactor);
    cp2X = pHeadLeftX - normalX * (actualTabHeight * 0.3);
    cp2Y = pHeadLeftY - normalY * (actualTabHeight * 0.3);

    cp3X =
      pHeadLeftX + normalX * (actualTabHeight * (0.22 + roundness * 0.08));
    cp3Y =
      pHeadLeftY + normalY * (actualTabHeight * (0.22 + roundness * 0.08));
    cp4X =
      pHeadRightX +
      normalX * (actualTabHeight * (0.22 + roundness * 0.08));
    cp4Y =
      pHeadRightY +
      normalY * (actualTabHeight * (0.22 + roundness * 0.08));

    cp5X = pHeadRightX - normalX * (actualTabHeight * 0.3);
    cp5Y = pHeadRightY - normalY * (actualTabHeight * 0.3);
    cp6X =
      basePointRightX + unitTangentX * (neckHalfWidth * neckBulgeFactor);
    cp6Y =
      basePointRightY + unitTangentY * (neckHalfWidth * neckBulgeFactor);
  }

  return {
    basePointLeftX,
    basePointLeftY,
    cp1X,
    cp1Y,
    cp2X,
    cp2Y,
    pHeadLeftX,
    pHeadLeftY,
    cp3X,
    cp3Y,
    cp4X,
    cp4Y,
    pHeadRightX,
    pHeadRightY,
    cp5X,
    cp5Y,
    cp6X,
    cp6Y,
    basePointRightX,
    basePointRightY,
    tabHeight: actualTabHeight * tabOrientation,
    tabCenterX: tabApexX,
    tabCenterY: tabApexY,
  };
}

/**
 * 画面比による極端なアスペクト比を制限し、中央配置用の寸法を計算する関数
 */
export function calculateConstrainedPuzzleDimensions(
  containerWidth: number,
  containerHeight: number,
): LayoutBounds {
  const outerPadding = Math.min(containerWidth, containerHeight) * 0.06;
  const maxWidth = Math.max(10, containerWidth - outerPadding * 2);
  const maxHeight = Math.max(10, containerHeight - outerPadding * 2);

  const minAspectRatio = 0.65;
  const maxAspectRatio = 1.55;
  const currentRatio = maxWidth / maxHeight;

  let targetWidth = maxWidth;
  let targetHeight = maxHeight;

  if (currentRatio > maxAspectRatio) {
    targetWidth = maxHeight * maxAspectRatio;
  } else if (currentRatio < minAspectRatio) {
    targetHeight = maxWidth / minAspectRatio;
  }

  const gridLeft = (containerWidth - targetWidth) * 0.5;
  const gridTop = (containerHeight - targetHeight) * 0.5;

  return {
    gridLeft,
    gridTop,
    availableWidth: targetWidth,
    availableHeight: targetHeight,
  };
}

/**
 * ウィンドウ寸法およびパズル描画領域からピース比率が1:1に近くなる最適な(列数, 行数)を算出
 */
export function calculateOptimalGridDimensions(
  windowWidth: number,
  windowHeight: number,
  targetCellSize = 115,
): { columns: number; rows: number } {
  const bounds = calculateConstrainedPuzzleDimensions(
    windowWidth,
    windowHeight,
  );
  const aspect = bounds.availableWidth / bounds.availableHeight;

  let rows = Math.round(bounds.availableHeight / targetCellSize);
  rows = Math.max(3, Math.min(12, rows));

  let cols = Math.round(rows * aspect);
  cols = Math.max(3, Math.min(16, cols));

  return { columns: cols, rows };
}

/**
 * ピース比率を1:1近くに保つよう、列数または行数を固定値として相手側を自動算出
 */
export function calculateBalancedGridDimensions(
  windowWidth: number,
  windowHeight: number,
  fixedDimension:
    | { type: "columns"; value: number }
    | { type: "rows"; value: number },
): { columns: number; rows: number } {
  const bounds = calculateConstrainedPuzzleDimensions(
    windowWidth,
    windowHeight,
  );
  const aspect = bounds.availableWidth / bounds.availableHeight;

  if (fixedDimension.type === "columns") {
    const cols = Math.max(2, Math.min(16, fixedDimension.value));
    const rows = Math.max(2, Math.min(16, Math.round(cols / aspect)));
    return { columns: cols, rows };
  }
  const rows = Math.max(2, Math.min(16, fixedDimension.value));
  const cols = Math.max(2, Math.min(16, Math.round(rows * aspect)));
  return { columns: cols, rows };
}

/**
 * 出っ張り部分の閉じたパスを構築する関数 (CanvasRenderingContext2D)
 */
export function traceJigsawTabClosedPath(
  context2D: CanvasRenderingContext2D,
  geometry: TabGeometry,
): void {
  // 法線ベクトル（タブ突出方向）の逆向きに根元ピース内部へオーバーラップさせて閉じる
  // これにより、セル矩形とタブ描画境界のアンチエイリアスによる塗り残し隙間を完全に防止
  const segDx = geometry.basePointRightX - geometry.basePointLeftX;
  const segDy = geometry.basePointRightY - geometry.basePointLeftY;
  const segLen = Math.hypot(segDx, segDy);

  let inwardX = 0;
  let inwardY = 0;
  if (segLen > 1e-4) {
    const tabOrientation = geometry.tabHeight >= 0 ? 1 : -1;
    const normX = (-segDy / segLen) * tabOrientation;
    const normY = (segDx / segLen) * tabOrientation;
    const overlapDistance = Math.max(
      2.5,
      Math.abs(geometry.tabHeight) * 0.12,
    );
    inwardX = -normX * overlapDistance;
    inwardY = -normY * overlapDistance;
  }

  context2D.beginPath();
  context2D.moveTo(geometry.basePointLeftX, geometry.basePointLeftY);
  context2D.bezierCurveTo(
    geometry.cp1X,
    geometry.cp1Y,
    geometry.cp2X,
    geometry.cp2Y,
    geometry.pHeadLeftX,
    geometry.pHeadLeftY,
  );
  context2D.bezierCurveTo(
    geometry.cp3X,
    geometry.cp3Y,
    geometry.cp4X,
    geometry.cp4Y,
    geometry.pHeadRightX,
    geometry.pHeadRightY,
  );
  context2D.bezierCurveTo(
    geometry.cp5X,
    geometry.cp5Y,
    geometry.cp6X,
    geometry.cp6Y,
    geometry.basePointRightX,
    geometry.basePointRightY,
  );
  // 根元ピース内部へオーバーラップして閉じる
  context2D.lineTo(
    geometry.basePointRightX + inwardX,
    geometry.basePointRightY + inwardY,
  );
  context2D.lineTo(
    geometry.basePointLeftX + inwardX,
    geometry.basePointLeftY + inwardY,
  );
  context2D.closePath();
}

/**
 * p5.Graphics / p5 に対して 1つのジグソー区間タブの輪郭を描画する関数
 */
export function renderJigsawEdgeSegment(
  renderer: p5.Graphics | p5,
  geometry: TabGeometry,
  endCoordinateX: number,
  endCoordinateY: number,
): void {
  renderer.vertex(geometry.basePointLeftX, geometry.basePointLeftY);
  renderer.bezierVertex(
    geometry.cp1X,
    geometry.cp1Y,
    geometry.cp2X,
    geometry.cp2Y,
    geometry.pHeadLeftX,
    geometry.pHeadLeftY,
  );
  renderer.bezierVertex(
    geometry.cp3X,
    geometry.cp3Y,
    geometry.cp4X,
    geometry.cp4Y,
    geometry.pHeadRightX,
    geometry.pHeadRightY,
  );
  renderer.bezierVertex(
    geometry.cp5X,
    geometry.cp5Y,
    geometry.cp6X,
    geometry.cp6Y,
    geometry.basePointRightX,
    geometry.basePointRightY,
  );
  renderer.vertex(endCoordinateX, endCoordinateY);
}
