import { useAtom } from "jotai";
import type React from "react";
import { PRESET_COLOR_PALETTES } from "../constants/palettes";
import type { JigsawConfigFile } from "../core/exporter";
import { calculateConstrainedPuzzleDimensions } from "../core/geometry";
import {
  initializeBoundaryLines,
  initializeJigsawGrid,
} from "../core/jigsawRenderer";
import {
  colorGridAtom,
  historyPointerAtom,
  historyStackAtom,
  horizontalLinesAtom,
  jigsawParamsAtom,
  randomTargetsAtom,
  toastsAtom,
  verticalLinesAtom,
} from "../state/jigsawStore";
import type { JigsawParamValue, JigsawParameters } from "../types/jigsaw";

export function useJigsawHandlers() {
  const [params, setParams] = useAtom(jigsawParamsAtom);
  const [, setColorGrid] = useAtom(colorGridAtom);
  const [, setHorizontalLines] = useAtom(horizontalLinesAtom);
  const [, setVerticalLines] = useAtom(verticalLinesAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyPointer, setHistoryPointer] = useAtom(historyPointerAtom);
  const [randomTargets] = useAtom(randomTargetsAtom);
  const [, setToasts] = useAtom(toastsAtom);

  const showToast = (message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const pushHistory = (newParams: JigsawParameters) => {
    const trimmed = historyStack.slice(0, historyPointer + 1);
    const updated = [...trimmed, JSON.parse(JSON.stringify(newParams))];
    if (updated.length > 50) updated.shift();
    setHistoryStack(updated);
    setHistoryPointer(updated.length - 1);
  };

  const handleParamChange = (
    key: keyof JigsawParameters,
    value: JigsawParamValue,
  ) => {
    const updated = { ...params, [key]: value };

    // columns or rows change or keepSquarePieceAspect toggle requires grid re-initialization
    if (
      key === "columns" ||
      key === "rows" ||
      key === "keepSquarePieceAspect"
    ) {
      let cols = key === "columns" ? (value as number) : params.columns;
      let rows = key === "rows" ? (value as number) : params.rows;
      const isAspectLocked =
        key === "keepSquarePieceAspect"
          ? (value as boolean)
          : updated.keepSquarePieceAspect;

      if (isAspectLocked) {
        const w = window.innerWidth || 800;
        const h = window.innerHeight || 600;
        const bounds = calculateConstrainedPuzzleDimensions(w, h);
        const aspect = bounds.availableWidth / bounds.availableHeight;

        if (key === "rows") {
          cols = Math.max(2, Math.min(16, Math.round(rows * aspect)));
        } else {
          rows = Math.max(2, Math.min(16, Math.round(cols / aspect)));
        }
      }

      updated.columns = cols;
      updated.rows = rows;
      setColorGrid(
        initializeJigsawGrid(cols, rows, updated.activeColorPalette),
      );
      const { horizontalBoundaryLines, verticalBoundaryLines } =
        initializeBoundaryLines(cols, rows);
      setHorizontalLines(horizontalBoundaryLines);
      setVerticalLines(verticalBoundaryLines);
    }

    // background change requires palette filter
    if (key === "backgroundColorHex") {
      const bgHex = (value as string).trim().toLowerCase();
      const currentPalette =
        PRESET_COLOR_PALETTES[params.currentPaletteIndex] ||
        PRESET_COLOR_PALETTES[0];
      const filtered = currentPalette.colors
        .map((c) => c.hex)
        .filter((hex) => hex.trim().toLowerCase() !== bgHex);
      updated.activeColorPalette =
        filtered.length > 0
          ? filtered
          : currentPalette.colors.map((c) => c.hex);
      setColorGrid(
        initializeJigsawGrid(
          params.columns,
          params.rows,
          updated.activeColorPalette,
        ),
      );
    }

    pushHistory(updated);
    setParams(updated);
  };

  const handleApplyPalette = (paletteIndex: number) => {
    const chosen =
      PRESET_COLOR_PALETTES[paletteIndex] || PRESET_COLOR_PALETTES[0];
    const bgHex = (params.backgroundColorHex || "").trim().toLowerCase();
    const candidateColors = chosen.colors
      .map((c) => c.hex)
      .filter((h) => h.trim().toLowerCase() !== bgHex);

    const activeColors =
      candidateColors.length > 0
        ? candidateColors
        : chosen.colors.map((c) => c.hex);

    const updated: JigsawParameters = {
      ...params,
      currentPaletteIndex: paletteIndex,
      activeColorPalette: activeColors,
    };

    pushHistory(updated);
    setParams(updated);
    setColorGrid(
      initializeJigsawGrid(params.columns, params.rows, activeColors),
    );
    showToast(`パレット変更: ${chosen.title}`);
  };

  const handlePickRandomPalette = () => {
    const randomIdx = Math.floor(
      Math.random() * PRESET_COLOR_PALETTES.length,
    );
    handleApplyPalette(randomIdx);
  };

  const handleGenerateGradientTheme = (baseColorHex: string) => {
    const baseR = Number.parseInt(baseColorHex.slice(1, 3), 16);
    const baseG = Number.parseInt(baseColorHex.slice(3, 5), 16);
    const baseB = Number.parseInt(baseColorHex.slice(5, 7), 16);

    const generatedColors: {
      name: string;
      hex: string;
      rgb: [number, number, number];
    }[] = [];
    const steps = 7;
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      const factor = 0.2 + (stepIndex / (steps - 1)) * 1.1;
      const targetR = Math.min(
        255,
        Math.max(0, Math.round(baseR * factor)),
      );
      const targetG = Math.min(
        255,
        Math.max(0, Math.round(baseG * factor)),
      );
      const targetB = Math.min(
        255,
        Math.max(0, Math.round(baseB * factor)),
      );
      const hexString = `#${targetR.toString(16).padStart(2, "0")}${targetG.toString(16).padStart(2, "0")}${targetB.toString(16).padStart(2, "0")}`;
      generatedColors.push({
        name: `Tone ${stepIndex + 1}`,
        hex: hexString,
        rgb: [targetR, targetG, targetB],
      });
    }

    const customGradientPalette = {
      title: `Gradient Theme (${baseColorHex})`,
      comment: "ベース色から生成された単色グラデーション",
      colors: generatedColors,
    };

    PRESET_COLOR_PALETTES.unshift(customGradientPalette);
    handleApplyPalette(0);
    showToast(`グラデーションテーマ生成: ${baseColorHex}`);
  };

  const handleShufflePaletteColors = () => {
    const shuffled = [...params.activeColorPalette].sort(
      () => Math.random() - 0.5,
    );
    const updated = { ...params, activeColorPalette: shuffled };
    pushHistory(updated);
    setParams(updated);
    setColorGrid(
      initializeJigsawGrid(params.columns, params.rows, shuffled),
    );
    showToast("パレット配色をシャッフルしました");
  };

  const randomizeSelectedParameters = () => {
    const updated = { ...params };

    if (randomTargets.keepSquarePieceAspect) {
      updated.keepSquarePieceAspect = Math.random() > 0.5;
    }

    if (
      randomTargets.columns ||
      randomTargets.rows ||
      randomTargets.keepSquarePieceAspect
    ) {
      if (updated.keepSquarePieceAspect) {
        const w = window.innerWidth || 800;
        const h = window.innerHeight || 600;
        const bounds = calculateConstrainedPuzzleDimensions(w, h);
        const aspect = bounds.availableWidth / bounds.availableHeight;
        const newCols = randomTargets.columns
          ? Math.floor(Math.random() * 8) + 3
          : updated.columns;
        updated.columns = newCols;
        updated.rows = Math.max(
          2,
          Math.min(16, Math.round(newCols / aspect)),
        );
      } else {
        if (randomTargets.columns) {
          updated.columns = Math.floor(Math.random() * 8) + 3;
        }
        if (randomTargets.rows) {
          updated.rows = Math.floor(Math.random() * 8) + 3;
        }
      }
    }

    if (randomTargets.tabShapeStyle) {
      const styles = [
        "circular",
        "classic",
        "bulb",
        "sharp",
        "trapezoid",
        "gentle",
      ] as const;
      updated.tabShapeStyle =
        styles[Math.floor(Math.random() * styles.length)];
    }

    if (randomTargets.tabSizeFactor) {
      updated.tabSizeFactor = Number(
        (0.08 + Math.random() * 0.18).toFixed(2),
      );
    }

    if (randomTargets.tabRoundness) {
      updated.tabRoundness = Number(
        (0.15 + Math.random() * 0.4).toFixed(2),
      );
    }

    if (randomTargets.motionProbability) {
      updated.motionProbability = Number(
        (0.25 + Math.random() * 0.6).toFixed(2),
      );
    }

    if (randomTargets.stepIntervalMilliseconds) {
      updated.stepIntervalMilliseconds = Math.floor(
        600 + Math.random() * 1800,
      );
    }

    if (randomTargets.burstCount) {
      updated.burstCount = Math.floor(1 + Math.random() * 3);
    }

    if (randomTargets.burstDelayMs) {
      updated.burstDelayMs =
        Math.floor((100 + Math.random() * 900) / 50) * 50;
    }

    if (randomTargets.easingDurationMilliseconds) {
      updated.easingDurationMilliseconds = Math.floor(
        300 + Math.random() * 600,
      );
    }

    if (randomTargets.strokeWidth) {
      updated.strokeWidth = Number((1.0 + Math.random() * 4.0).toFixed(1));
    }

    if (randomTargets.palette) {
      const randIdx = Math.floor(
        Math.random() * PRESET_COLOR_PALETTES.length,
      );
      const chosen = PRESET_COLOR_PALETTES[randIdx];
      const bgHex = (updated.backgroundColorHex || "")
        .trim()
        .toLowerCase();
      const filtered = chosen.colors
        .map((c) => c.hex)
        .filter((h) => h.trim().toLowerCase() !== bgHex);
      updated.currentPaletteIndex = randIdx;
      updated.activeColorPalette =
        filtered.length > 0 ? filtered : chosen.colors.map((c) => c.hex);
      if (randomTargets.paletteShuffle) {
        updated.activeColorPalette = [...updated.activeColorPalette].sort(
          () => Math.random() - 0.5,
        );
      }
    } else if (randomTargets.paletteShuffle) {
      updated.activeColorPalette = [...updated.activeColorPalette].sort(
        () => Math.random() - 0.5,
      );
    }

    if (randomTargets.monochromeFillActive) {
      updated.monochromeFillActive = Math.random() > 0.5;
    }

    if (randomTargets.reactiveFadeMode) {
      updated.reactiveFadeMode = Math.random() > 0.5;
    }

    if (randomTargets.grainActive) {
      updated.grainActive = Math.random() > 0.3;
    }

    pushHistory(updated);
    setParams(updated);

    setColorGrid(
      initializeJigsawGrid(
        updated.columns,
        updated.rows,
        updated.activeColorPalette,
      ),
    );
    const { horizontalBoundaryLines, verticalBoundaryLines } =
      initializeBoundaryLines(updated.columns, updated.rows);
    setHorizontalLines(horizontalBoundaryLines);
    setVerticalLines(verticalBoundaryLines);

    showToast("パラメータをランダム設定しました");
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const nextPointer = historyPointer - 1;
      const prevParams = historyStack[nextPointer];
      setHistoryPointer(nextPointer);
      setParams(prevParams);
      setColorGrid(
        initializeJigsawGrid(
          prevParams.columns,
          prevParams.rows,
          prevParams.activeColorPalette,
        ),
      );
      const { horizontalBoundaryLines, verticalBoundaryLines } =
        initializeBoundaryLines(prevParams.columns, prevParams.rows);
      setHorizontalLines(horizontalBoundaryLines);
      setVerticalLines(verticalBoundaryLines);
      showToast("元に戻しました (Undo)");
    }
  };

  const handleRedo = () => {
    if (historyPointer < historyStack.length - 1) {
      const nextPointer = historyPointer + 1;
      const nextParams = historyStack[nextPointer];
      setHistoryPointer(nextPointer);
      setParams(nextParams);
      setColorGrid(
        initializeJigsawGrid(
          nextParams.columns,
          nextParams.rows,
          nextParams.activeColorPalette,
        ),
      );
      const { horizontalBoundaryLines, verticalBoundaryLines } =
        initializeBoundaryLines(nextParams.columns, nextParams.rows);
      setHorizontalLines(horizontalBoundaryLines);
      setVerticalLines(verticalBoundaryLines);
      showToast("やり直しました (Redo)");
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(
          ev.target?.result as string,
        ) as JigsawConfigFile;
        if (parsed.parameters) {
          pushHistory(parsed.parameters);
          setParams(parsed.parameters);
          if (parsed.colorGrid) setColorGrid(parsed.colorGrid);
          if (parsed.boundaryLines?.horizontal) {
            setHorizontalLines(parsed.boundaryLines.horizontal);
          }
          if (parsed.boundaryLines?.vertical) {
            setVerticalLines(parsed.boundaryLines.vertical);
          }
          showToast("JSON設定を復元しました");
        }
      } catch (err) {
        console.error("JSON解析エラー:", err);
        showToast("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return {
    handleParamChange,
    handleApplyPalette,
    handlePickRandomPalette,
    handleShufflePaletteColors,
    handleGenerateGradientTheme,
    randomizeSelectedParameters,
    handleUndo,
    handleRedo,
    handleImportJson,
    showToast,
  };
}
