import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import {
  DicesIcon,
  InfoIcon,
  Redo2Icon,
  SettingsIcon,
  SlidersHorizontalIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import {
  historyPointerAtom,
  historyStackAtom,
  isPanelOpenAtom,
  isRandomTargetsModalOpenAtom,
  jigsawParamsAtom,
  toastsAtom,
} from "../state/jigsawStore";
import type { JigsawParamValue, JigsawParameters } from "../types/jigsaw";
import { RandomTargetsDrawer } from "./drawers/RandomTargetsDrawer";
import { ColorPaletteSection } from "./sections/ColorPaletteSection";
import { EffectsSection } from "./sections/EffectsSection";
import { ExportSection } from "./sections/ExportSection";
import { GridScaleSection } from "./sections/GridScaleSection";
import { MotionSection } from "./sections/MotionSection";
import { OperationsSection } from "./sections/OperationsSection";

interface Props {
  onParamChange: (
    key: keyof JigsawParameters,
    val: JigsawParamValue,
  ) => void;
  onApplyPalette: (idx: number) => void;
  onPickRandomPalette: () => void;
  onShufflePaletteColors: () => void;
  onGenerateGradientTheme: (baseHex: string) => void;
  onRandomizeAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartNLoopRecord: (loopCount: number) => void;
  onStopNLoopRecord: () => void;
}

export const ControlPanel: React.FC<Props> = ({
  onParamChange,
  onApplyPalette,
  onPickRandomPalette,
  onShufflePaletteColors,
  onGenerateGradientTheme,
  onRandomizeAll,
  onUndo,
  onRedo,
  onExportPng,
  onExportSvg,
  onStartRecord,
  onStopRecord,
  onExportJson,
  onImportJson,
  onStartNLoopRecord,
  onStopNLoopRecord,
}) => {
  const [params] = useAtom(jigsawParamsAtom);
  const [isOpen, setIsOpen] = useAtom(isPanelOpenAtom);
  const [isDrawerOpen, setIsDrawerOpen] = useAtom(
    isRandomTargetsModalOpenAtom,
  );
  const [historyStack] = useAtom(historyStackAtom);
  const [historyPointer] = useAtom(historyPointerAtom);
  const [toasts] = useAtom(toastsAtom);

  const canUndo = historyPointer > 0;
  const canRedo = historyPointer < historyStack.length - 1;

  const panelContainerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click (handles both panel and random target drawer)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!isOpen) return;

      const path = e.composedPath?.() || [];
      if (
        panelContainerRef.current &&
        (path.includes(panelContainerRef.current) ||
          panelContainerRef.current.contains(e.target as Node))
      ) {
        return;
      }

      setIsOpen(false);
      setIsDrawerOpen(false);
    };

    window.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      window.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isOpen, setIsOpen, setIsDrawerOpen]);

  return (
    <>
      {/* Floating Toggle Button (Visible ONLY when Panel is Closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="ツール設定 (H)"
          aria-label="ツール設定を開く"
          className="absolute top-4 left-4 z-50 bg-white/70 hover:bg-white/90 text-gray-800 hover:text-gray-950 p-2.5 rounded-md shadow-lg backdrop-blur-md border border-white/50 transition-all flex items-center justify-center cursor-pointer active:scale-95"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      )}

      {/* Toast Notifications */}
      <aside
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="px-3.5 py-2 bg-white/85 text-gray-900 border border-white/60 rounded-md shadow-2xl backdrop-blur-xl text-xs font-medium flex items-center gap-2"
            >
              <InfoIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>

      {/* Sidebar Layout: Main Panel + Right Extension Sub-Panel */}
      <AnimatePresence>
        {isOpen && (
          <div
            ref={panelContainerRef}
            className="absolute top-4 left-4 bottom-4 flex items-start gap-3 z-40 pointer-events-none"
          >
            {/* Main Panel */}
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-96 h-full bg-white/65 backdrop-blur-xl text-gray-900 rounded-md shadow-2xl border border-white/50 flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-gray-200/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-gray-800" />
                  <span className="text-xs font-bold tracking-wide text-gray-900">
                    ツール設定
                  </span>
                  {import.meta.env.DEV && (
                    <span className="bg-amber-100/90 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] leading-none select-none">
                      DEV
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsDrawerOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-900 p-1 rounded hover:bg-gray-200/50 transition cursor-pointer"
                  title="パネルを閉じる"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Fixed Top Quick Action Bar: Random button remains accessible on scroll */}
              <div className="p-3 border-b border-gray-200/50 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onRandomizeAll}
                    title="選択された対象パラメータをランダム設定します (スペースキー)"
                    className="flex-1 bg-gray-900/90 hover:bg-gray-900 active:scale-[0.99] text-white py-2 px-3 rounded font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm backdrop-blur-xs"
                  >
                    <DicesIcon className="w-4 h-4" />
                    <span>ランダム実行 (Space)</span>
                  </button>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!canUndo}
                      onClick={onUndo}
                      title="元に戻す (Ctrl+Z)"
                      className="bg-white/70 hover:bg-white/95 disabled:opacity-40 text-gray-800 border border-gray-300/80 px-2 py-1.5 rounded transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed text-xs font-medium shadow-xs"
                    >
                      <Undo2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!canRedo}
                      onClick={onRedo}
                      title="やり直す (Ctrl+Y)"
                      className="bg-white/70 hover:bg-white/95 disabled:opacity-40 text-gray-800 border border-gray-300/80 px-2 py-1.5 rounded transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed text-xs font-medium shadow-xs"
                    >
                      <Redo2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen((prev) => !prev)}
                  title="ランダム化対象の選択ドロワーを右側に開閉します"
                  className={`w-full py-1.5 rounded border transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                    isDrawerOpen
                      ? "bg-gray-200/80 border-gray-400 text-gray-900 font-semibold shadow-inner ring-1 ring-gray-400/40"
                      : "bg-white/70 hover:bg-white/95 text-gray-700 border-gray-300/80 shadow-xs font-medium"
                  }`}
                >
                  <SlidersHorizontalIcon className="w-3.5 h-3.5" />
                  <span>
                    ランダム対象パラメータの選択 {isDrawerOpen ? "◀" : "▶"}
                  </span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
                <OperationsSection onUndo={onUndo} onRedo={onRedo} />
                <GridScaleSection
                  params={params}
                  onParamChange={onParamChange}
                />
                <MotionSection
                  params={params}
                  onParamChange={onParamChange}
                />
                <ColorPaletteSection
                  params={params}
                  onParamChange={onParamChange}
                  onApplyPalette={onApplyPalette}
                  onPickRandomPalette={onPickRandomPalette}
                  onShufflePaletteColors={onShufflePaletteColors}
                  onGenerateGradientTheme={onGenerateGradientTheme}
                />
                <EffectsSection
                  params={params}
                  onParamChange={onParamChange}
                />
                <ExportSection
                  onExportPng={onExportPng}
                  onExportSvg={onExportSvg}
                  onStartRecord={onStartRecord}
                  onStopRecord={onStopRecord}
                  onExportJson={onExportJson}
                  onImportJson={onImportJson}
                  onStartNLoopRecord={onStartNLoopRecord}
                  onStopNLoopRecord={onStopNLoopRecord}
                />

                {/* Shortcuts Footer Badge */}
                <div className="pt-2 text-[10px] text-gray-500 flex flex-wrap gap-1.5 items-center justify-center border-t border-gray-200/60">
                  <span>
                    <span className="kbd-key">Space</span> ランダム
                  </span>
                  <span>
                    <span className="kbd-key">H</span> パネル
                  </span>
                  <span>
                    <span className="kbd-key">R</span> 録画
                  </span>
                  <span>
                    <span className="kbd-key">S</span> 停止
                  </span>
                  <span>
                    <span className="kbd-key">P</span> PNG
                  </span>
                  <span>
                    <span className="kbd-key">D</span> Debug
                  </span>
                  <span>
                    <span className="kbd-key">Ctrl+Z</span> Undo
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Sub-panel Extension for Random Targets */}
            <RandomTargetsDrawer />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
