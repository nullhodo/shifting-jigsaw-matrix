export type TabShapeStyle =
  | "circular"
  | "classic"
  | "bulb"
  | "sharp"
  | "trapezoid"
  | "gentle";

export interface ColorItem {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface Palette {
  title: string;
  comment: string;
  colors: ColorItem[];
}

export interface JigsawParameters {
  columns: number;
  rows: number;
  keepSquarePieceAspect: boolean;
  tabShapeStyle: TabShapeStyle;
  tabSizeFactor: number;
  tabRoundness: number;
  monochromeFillActive: boolean;
  singlePieceColorHex: string;
  reactiveFadeMode: boolean;
  reactiveTriggerEdges: 1 | 2;
  fadeInDurationMs: number;
  fadeDurationMs: number;
  reactiveBaseColorHex: string;
  motionProbability: number;
  stepIntervalMilliseconds: number;
  burstCount: number;
  burstDelayMs: number;
  easingDurationMilliseconds: number;
  strokeWidth: number;
  strokeColorHex: string;
  backgroundColorHex: string;
  grainActive: boolean;
  grainIntensity: number;
  currentPaletteIndex: number;
  activeColorPalette: string[];
  debugModeActive: boolean;
  autoRandomActive: boolean;
  autoRandomIntervalMs: number;
}

export interface BoundaryLine {
  defaultDirection: number;
  currentStepUnit: number;
  previousStepUnit: number;
  targetStepUnit: number;
  shiftOffset: number;
  isTransitioning: boolean;
  transitionStartTimestamp: number;
  tabDirections: number[];
  pendingSteps?: number;
}

export interface TabGeometry {
  basePointLeftX: number;
  basePointLeftY: number;
  cp1X: number;
  cp1Y: number;
  cp2X: number;
  cp2Y: number;
  pHeadLeftX: number;
  pHeadLeftY: number;
  cp3X: number;
  cp3Y: number;
  cp4X: number;
  cp4Y: number;
  pHeadRightX: number;
  pHeadRightY: number;
  cp5X: number;
  cp5Y: number;
  cp6X: number;
  cp6Y: number;
  basePointRightX: number;
  basePointRightY: number;
  tabHeight: number;
  tabCenterX: number;
  tabCenterY: number;
}

export interface LayoutBounds {
  gridLeft: number;
  gridTop: number;
  availableWidth: number;
  availableHeight: number;
}

export interface RandomTargets {
  columns: boolean;
  rows: boolean;
  keepSquarePieceAspect: boolean;
  tabShapeStyle: boolean;
  tabSizeFactor: boolean;
  tabRoundness: boolean;
  motionProbability: boolean;
  stepIntervalMilliseconds: boolean;
  burstCount: boolean;
  burstDelayMs: boolean;
  easingDurationMilliseconds: boolean;
  strokeWidth: boolean;
  palette: boolean;
  paletteShuffle: boolean;
  monochromeFillActive: boolean;
  reactiveFadeMode: boolean;
  grainActive: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  elapsedSeconds: number;
  isLoopMode?: boolean;
  currentLoop?: number;
  totalLoops?: number;
  loopIntervalMs?: number;
}

export type JigsawParamValue = number | boolean | string | string[];
