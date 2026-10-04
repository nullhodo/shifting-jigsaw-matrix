import { useAtom } from "jotai";
import p5 from "p5";
import p5Svg from "p5.js-svg";
import type React from "react";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { ControlPanel } from "./components/ControlPanel";
import { RecordingOverlay } from "./components/RecordingOverlay";
import {
  exportHighResolutionImageWithMetadata,
  exportParameterStateJSON,
  exportSvgGraphics,
} from "./core/exporter";
import {
  calculateConstrainedPuzzleDimensions,
  calculateOptimalGridDimensions,
} from "./core/geometry";
import {
  generateGrainNoiseTexture,
  initializeBoundaryLines,
  initializeJigsawGrid,
  renderCompleteJigsawPuzzle,
  safelyDisposeGraphics,
} from "./core/jigsawRenderer";
import { updateBoundaryLinesMotion } from "./core/motion";
import {
  type PieceActivationState,
  updatePieceActivations,
} from "./core/reactiveColoring";
import { VideoRecorderManager } from "./core/recorder";
import { useJigsawHandlers } from "./hooks/useJigsawHandlers";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWheelRangeSlider } from "./hooks/useWheelRangeSlider";
import "./index.css";
import {
  autoRandomIntervalMsAtom,
  colorGridAtom,
  historyStackAtom,
  horizontalLinesAtom,
  isAutoRandomActiveAtom,
  isLoopRecordingActiveAtom,
  isPanelOpenAtom,
  jigsawParamsAtom,
  recordingStateAtom,
  verticalLinesAtom,
} from "./state/jigsawStore";

// Initialize p5 SVG plugin
p5Svg(p5);

// Set [DEV] title prefix in local development mode
if (import.meta.env.DEV && !document.title.startsWith("[DEV]")) {
  document.title = `[DEV] ${document.title}`;
}

const App: React.FC = () => {
  const [params, setParams] = useAtom(jigsawParamsAtom);
  const [, setHistoryStack] = useAtom(historyStackAtom);
  const [colorGrid, setColorGrid] = useAtom(colorGridAtom);
  const [horizontalLines, setHorizontalLines] = useAtom(
    horizontalLinesAtom,
  );
  const [verticalLines, setVerticalLines] = useAtom(verticalLinesAtom);
  const [, setRecordingState] = useAtom(recordingStateAtom);
  const [, setIsPanelOpen] = useAtom(isPanelOpenAtom);
  const [isAutoRandom, setIsAutoRandom] = useAtom(isAutoRandomActiveAtom);
  const [autoRandomIntervalMs] = useAtom(autoRandomIntervalMsAtom);
  const [, setIsLoopRecordingActive] = useAtom(isLoopRecordingActiveAtom);

  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const recorderRef = useRef<VideoRecorderManager | null>(null);
  const grainBufferRef = useRef<p5.Graphics | null>(null);
  const lastGrainIntensityRef = useRef(-1);

  const paramsRef = useRef(params);
  const colorGridRef = useRef(colorGrid);
  const horizontalLinesRef = useRef(horizontalLines);
  const verticalLinesRef = useRef(verticalLines);
  const motionTimingRef = useRef({
    cycleStartTimestamp: -1,
    triggeredBurstsInCycle: 0,
  });
  const pieceActivationGridRef = useRef<number[][]>([]);
  const pieceActivationStatesRef = useRef<PieceActivationState[][]>([]);

  const loopTimerRef = useRef<{
    timeouts: ReturnType<typeof setTimeout>[];
    intervalId?: ReturnType<typeof setInterval>;
  }>({ timeouts: [] });

  const clearLoopTimers = () => {
    for (const t of loopTimerRef.current.timeouts) clearTimeout(t);
    loopTimerRef.current.timeouts = [];
    if (loopTimerRef.current.intervalId) {
      clearInterval(loopTimerRef.current.intervalId);
      loopTimerRef.current.intervalId = undefined;
    }
  };

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    colorGridRef.current = colorGrid;
  }, [colorGrid]);

  useEffect(() => {
    horizontalLinesRef.current = horizontalLines;
  }, [horizontalLines]);

  useEffect(() => {
    verticalLinesRef.current = verticalLines;
  }, [verticalLines]);

  const {
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
  } = useJigsawHandlers();

  // Auto Random Interval management
  useEffect(() => {
    if (!isAutoRandom) return;
    const interval = setInterval(() => {
      randomizeSelectedParameters();
    }, autoRandomIntervalMs);
    return () => clearInterval(interval);
  }, [isAutoRandom, autoRandomIntervalMs, randomizeSelectedParameters]);

  const handleStartRecord = async () => {
    if (recorderRef.current) {
      clearLoopTimers();
      setIsLoopRecordingActive(false);
      setRecordingState({ isRecording: true, elapsedSeconds: 0 });
      await recorderRef.current.startRecording();
      showToast("動画録画を開始しました (60fps MP4)");
    }
  };

  const handleStopRecord = async () => {
    clearLoopTimers();
    setIsLoopRecordingActive(false);
    if (recorderRef.current) {
      const savedFilename = await recorderRef.current.stopRecording();
      setRecordingState({ isRecording: false, elapsedSeconds: 0 });
      if (savedFilename) {
        showToast(`録画保存完了: ${savedFilename}`);
      }
    }
  };

  const handleStartNLoopRecord = async (requestedLoops: number) => {
    if (!recorderRef.current) return;

    clearLoopTimers();
    setIsAutoRandom(false);

    const N = requestedLoops;
    const T = autoRandomIntervalMs;

    setIsLoopRecordingActive(true);
    setRecordingState({
      isRecording: true,
      elapsedSeconds: 0,
      isLoopMode: true,
      currentLoop: 1,
      totalLoops: N,
      loopIntervalMs: T,
    });

    const success = await recorderRef.current.startRecording();
    if (!success) {
      setIsLoopRecordingActive(false);
      return;
    }

    // Step 1: Immediately randomize at t=0
    randomizeSelectedParameters();
    showToast(`${N}ループ正確録画を開始しました`);

    const startTime = performance.now();

    const timerId = setInterval(() => {
      const elapsedMs = performance.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const currLoop = Math.min(N, Math.floor(elapsedMs / T) + 1);
      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        elapsedSeconds: elapsedSec,
        isLoopMode: true,
        currentLoop: currLoop,
        totalLoops: N,
        loopIntervalMs: T,
      }));
    }, 100);
    loopTimerRef.current.intervalId = timerId;

    // Schedule intermediate randomizations
    for (let k = 1; k < N; k++) {
      const timeout = setTimeout(() => {
        randomizeSelectedParameters();
      }, k * T);
      loopTimerRef.current.timeouts.push(timeout);
    }

    // Final: Stop recording exactly at N * T
    const finalTimeout = setTimeout(async () => {
      clearLoopTimers();
      setIsLoopRecordingActive(false);
      if (recorderRef.current) {
        const saved = await recorderRef.current.stopRecording();
        setRecordingState({ isRecording: false, elapsedSeconds: 0 });
        if (saved) {
          showToast(`N-Loop録画完了: ${saved}`);
        }
      }
    }, N * T);
    loopTimerRef.current.timeouts.push(finalTimeout);
  };

  const handleExportPng = () => {
    if (p5InstanceRef.current) {
      exportHighResolutionImageWithMetadata(
        p5InstanceRef.current,
        paramsRef.current,
        colorGridRef.current,
        horizontalLinesRef.current,
        verticalLinesRef.current,
        2880,
        paramsRef.current.reactiveFadeMode
          ? pieceActivationGridRef.current
          : undefined,
      );
      showToast("高解像度 PNG と JSON 設定を出力しました");
    }
  };

  const handleExportSvg = () => {
    if (p5InstanceRef.current) {
      exportSvgGraphics(
        p5InstanceRef.current,
        paramsRef.current,
        colorGridRef.current,
        horizontalLinesRef.current,
        verticalLinesRef.current,
        1920,
        paramsRef.current.reactiveFadeMode
          ? pieceActivationGridRef.current
          : undefined,
      );
      showToast("ベクター SVG を出力しました");
    }
  };

  const handleExportJson = () => {
    exportParameterStateJSON(
      paramsRef.current,
      colorGridRef.current,
      horizontalLinesRef.current,
      verticalLinesRef.current,
    );
    showToast("JSON 設定を出力しました");
  };

  useKeyboardShortcuts({
    onRandomizeAll: randomizeSelectedParameters,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onTogglePanel: () => setIsPanelOpen((prev) => !prev),
    onStartRecord: handleStartRecord,
    onStopRecord: handleStopRecord,
    onToggleDebug: () =>
      handleParamChange(
        "debugModeActive",
        !paramsRef.current.debugModeActive,
      ),
    onExportImage: handleExportPng,
  });

  useWheelRangeSlider();

  // p5 Sketch Lifecycle
  useEffect(() => {
    if (!p5ContainerRef.current) return;

    const container = p5ContainerRef.current;
    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;

    // 初回ロード時: ウィンドウサイズから自動でピースが1:1に近くなる最適な行列数を算出・適用
    const optimal = calculateOptimalGridDimensions(initialW, initialH);
    const initialCols = optimal.columns;
    const initialRows = optimal.rows;

    paramsRef.current.columns = initialCols;
    paramsRef.current.rows = initialRows;
    setParams((prev) => ({
      ...prev,
      columns: initialCols,
      rows: initialRows,
    }));
    setHistoryStack([
      {
        ...paramsRef.current,
        columns: initialCols,
        rows: initialRows,
      },
    ]);

    // Initialize grid & boundaries initially with optimal counts
    const initialGrid = initializeJigsawGrid(
      initialCols,
      initialRows,
      paramsRef.current.activeColorPalette,
    );
    setColorGrid(initialGrid);

    const { horizontalBoundaryLines, verticalBoundaryLines } =
      initializeBoundaryLines(initialCols, initialRows);
    setHorizontalLines(horizontalBoundaryLines);
    setVerticalLines(verticalBoundaryLines);

    const sketch = (p: p5) => {
      p.setup = () => {
        const container = p5ContainerRef.current;
        const w =
          container && container.clientWidth > 0
            ? container.clientWidth
            : window.innerWidth;
        const h =
          container && container.clientHeight > 0
            ? container.clientHeight
            : window.innerHeight;

        const canvas = p.createCanvas(w, h);
        canvas.parent(container || document.body);
        p.frameRate(60);

        // Setup recorder
        const canvasElt = canvas.elt as HTMLCanvasElement;
        recorderRef.current = new VideoRecorderManager(
          canvasElt,
          (recording, elapsed) => {
            setRecordingState((prev) => ({
              ...prev,
              isRecording: recording,
              elapsedSeconds: elapsed,
            }));
          },
        );

        grainBufferRef.current = generateGrainNoiseTexture(
          p,
          paramsRef.current.grainIntensity,
        );
        lastGrainIntensityRef.current = paramsRef.current.grainIntensity;
      };

      p.draw = () => {
        const container = p5ContainerRef.current;
        if (
          container &&
          container.clientWidth > 10 &&
          container.clientHeight > 10
        ) {
          if (
            p.width !== container.clientWidth ||
            p.height !== container.clientHeight
          ) {
            p.resizeCanvas(container.clientWidth, container.clientHeight);
          }
        }

        if (p.width <= 10 || p.height <= 10) return;

        const currentParams = paramsRef.current;
        const currentGrid = colorGridRef.current;
        const currentH = horizontalLinesRef.current;
        const currentV = verticalLinesRef.current;

        // Ensure safe grid
        if (
          !currentGrid ||
          currentGrid.length !== currentParams.rows ||
          !currentGrid[0] ||
          currentGrid[0].length !== currentParams.columns
        ) {
          return;
        }

        // Calculate motion using the exact constrained puzzle dimensions
        const layoutBounds = calculateConstrainedPuzzleDimensions(
          p.width,
          p.height,
        );
        const cellW = layoutBounds.availableWidth / currentParams.columns;
        const cellH = layoutBounds.availableHeight / currentParams.rows;

        const motionResult = updateBoundaryLinesMotion(
          currentH,
          currentV,
          cellW,
          cellH,
          currentParams.motionProbability,
          currentParams.stepIntervalMilliseconds,
          currentParams.easingDurationMilliseconds,
          performance.now(),
          motionTimingRef.current.cycleStartTimestamp,
          currentParams.burstCount,
          currentParams.burstDelayMs,
          motionTimingRef.current.triggeredBurstsInCycle,
        );
        motionTimingRef.current.cycleStartTimestamp =
          motionResult.cycleStartTimestamp;
        motionTimingRef.current.triggeredBurstsInCycle =
          motionResult.triggeredBurstsInCycle;

        // Update grain noise texture if intensity or active state changed
        if (currentParams.grainActive) {
          if (
            !grainBufferRef.current ||
            grainBufferRef.current.width <= 0 ||
            Math.abs(
              currentParams.grainIntensity - lastGrainIntensityRef.current,
            ) > 0.001
          ) {
            grainBufferRef.current = generateGrainNoiseTexture(
              p,
              currentParams.grainIntensity,
              grainBufferRef.current,
            );
            lastGrainIntensityRef.current = currentParams.grainIntensity;
          }
        } else if (grainBufferRef.current) {
          safelyDisposeGraphics(grainBufferRef.current);
          grainBufferRef.current = null;
          lastGrainIntensityRef.current = -1;
        }

        // Update piece activations for reactive fade coloring mode
        const now = performance.now();
        if (currentParams.reactiveFadeMode) {
          const actResult = updatePieceActivations(
            currentParams.rows,
            currentParams.columns,
            currentH,
            currentV,
            now,
            currentParams.fadeInDurationMs,
            currentParams.fadeDurationMs,
            pieceActivationStatesRef.current,
            currentParams.easingDurationMilliseconds,
          );
          pieceActivationGridRef.current = actResult.activationGrid;
          pieceActivationStatesRef.current = actResult.updatedPieceStates;
        }

        renderCompleteJigsawPuzzle(
          p,
          p.width,
          p.height,
          currentParams,
          currentGrid,
          currentH,
          currentV,
          grainBufferRef.current,
          false,
          currentParams.reactiveFadeMode
            ? pieceActivationGridRef.current
            : undefined,
        );
      };

      p.windowResized = () => {
        const container = p5ContainerRef.current;
        const nw =
          container && container.clientWidth > 0
            ? container.clientWidth
            : window.innerWidth;
        const nh =
          container && container.clientHeight > 0
            ? container.clientHeight
            : window.innerHeight;
        if (nw > 10 && nh > 10) {
          p.resizeCanvas(nw, nh);

          // ピース比率維持オプションがONの場合、リサイズ時にも比率を1:1近くに保つ
          if (paramsRef.current.keepSquarePieceAspect) {
            const layout = calculateConstrainedPuzzleDimensions(nw, nh);
            const aspect = layout.availableWidth / layout.availableHeight;
            const newRows = Math.max(
              2,
              Math.min(16, Math.round(paramsRef.current.columns / aspect)),
            );
            if (newRows !== paramsRef.current.rows) {
              handleParamChange("rows", newRows);
            }
          }
        }
      };
    };

    const instance = new p5(sketch);
    p5InstanceRef.current = instance;

    return () => {
      clearLoopTimers();
      instance.remove();
      p5InstanceRef.current = null;
      recorderRef.current = null;
    };
  }, [
    setColorGrid,
    setHorizontalLines,
    setVerticalLines,
    setRecordingState,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121318] select-none">
      {/* p5 Canvas Container */}
      <div
        ref={p5ContainerRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Recording Overlay */}
      <RecordingOverlay onStopRecord={handleStopRecord} />

      {/* Control Panel */}
      <ControlPanel
        onParamChange={handleParamChange}
        onApplyPalette={handleApplyPalette}
        onPickRandomPalette={handlePickRandomPalette}
        onShufflePaletteColors={handleShufflePaletteColors}
        onGenerateGradientTheme={handleGenerateGradientTheme}
        onRandomizeAll={randomizeSelectedParameters}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onStartRecord={handleStartRecord}
        onStopRecord={handleStopRecord}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onStartNLoopRecord={handleStartNLoopRecord}
        onStopNLoopRecord={handleStopRecord}
      />
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
