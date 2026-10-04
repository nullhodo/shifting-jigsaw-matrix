import type { JigsawParameters, RandomTargets } from "../types/jigsaw";
import { PRESET_COLOR_PALETTES } from "./palettes";

const starburstIdx = PRESET_COLOR_PALETTES.findIndex((p) =>
  p.title.toLowerCase().includes("starburst"),
);

const initialPaletteIdx = starburstIdx !== -1 ? starburstIdx : 0;
const initialPalette = PRESET_COLOR_PALETTES[initialPaletteIdx];

export const DEFAULT_JIGSAW_PARAMETERS: JigsawParameters = {
  columns: 6,
  rows: 6,
  keepSquarePieceAspect: false,
  tabShapeStyle: "circular",
  tabSizeFactor: 0.16,
  tabRoundness: 0.28,
  monochromeFillActive: false,
  singlePieceColorHex: "#e2ad3e",
  reactiveFadeMode: false,
  reactiveTriggerEdges: 2,
  fadeInDelayMs: 0,
  fadeInDurationMs: 450,
  fadeDurationMs: 1800,
  reactiveBaseColorHex: "#1e293b",
  motionProbability: 0.5,
  stepIntervalMilliseconds: 1200,
  burstCount: 2,
  burstDelayMs: 250,
  easingDurationMilliseconds: 600,
  strokeWidth: 2.5,
  strokeColorHex: "#0f172a",
  backgroundColorHex: "#090d16",
  grainActive: true,
  grainIntensity: 0.14,
  currentPaletteIndex: initialPaletteIdx,
  activeColorPalette: initialPalette.colors
    .map((c) => c.hex)
    .filter((h) => h.toLowerCase() !== "#090d16"),
  debugModeActive: false,
  autoRandomActive: false,
  autoRandomIntervalMs: 4000,
};

export const DEFAULT_RANDOM_TARGETS: RandomTargets = {
  columns: true,
  rows: true,
  keepSquarePieceAspect: false,
  tabShapeStyle: false,
  tabSizeFactor: false,
  tabRoundness: false,
  motionProbability: true,
  stepIntervalMilliseconds: true,
  burstCount: true,
  burstDelayMs: true,
  easingDurationMilliseconds: true,
  strokeWidth: false,
  palette: true,
  paletteShuffle: true,
  monochromeFillActive: false,
  reactiveFadeMode: false,
  grainActive: false,
};
