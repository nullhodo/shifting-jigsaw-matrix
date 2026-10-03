import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import {
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
  jigsawParamsAtom,
  toastsAtom,
} from "../state/jigsawStore";
import type { JigsawParamValue, JigsawParameters } from "../types/jigsaw";
import { AutomationSection } from "./sections/AutomationSection";
import { ColorPaletteSection } from "./sections/ColorPaletteSection";
import { EffectsSection } from "./sections/EffectsSection";
import { ExportSection } from "./sections/ExportSection";
import { GridScaleSection } from "./sections/GridScaleSection";
import { MotionSection } from "./sections/MotionSection";

interface Props {
  onParamChange: (
    key: keyof JigsawParameters,
    val: JigsawParamValue,
  ) => void;
  onApplyPalette: (idx: number) => void;
  onPickRandomPalette: () => void;
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
}

export const ControlPanel: React.FC<Props> = ({
  onParamChange,
  onApplyPalette,
  onPickRandomPalette,
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
}) => {
  const [params] = useAtom(jigsawParamsAtom);
  const [isOpen, setIsOpen] = useAtom(isPanelOpenAtom);
  const [historyStack] = useAtom(historyStackAtom);
  const [historyPointer] = useAtom(historyPointerAtom);
  const [toasts] = useAtom(toastsAtom);

  const canUndo = historyPointer > 0;
  const canRedo = historyPointer < historyStack.length - 1;

  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!isOpen) return;
      const path = e.composedPath?.() || [];
      if (
        panelRef.current &&
        (path.includes(panelRef.current) ||
          panelRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      window.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Floating Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="パネルを開く (H)"
          className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
        >
          <SlidersHorizontalIcon className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold tracking-wider">PANEL</span>
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
              className="px-4 py-2.5 bg-slate-900/95 text-slate-100 border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2"
            >
              <InfoIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>

      {/* Main Glassmorphism Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            ref={panelRef}
            initial={{ x: -420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -420, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-3 left-3 bottom-3 w-88 sm:w-96 z-40 bg-slate-950/85 text-slate-100 rounded-2xl shadow-2xl border border-slate-800/80 backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="pt-3.5 pb-3 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-sky-400" />
                <div>
                  <h1 className="text-xs font-bold tracking-wide text-sky-400 leading-tight">
                    SHIFTING JIGSAW
                  </h1>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    M×N Kinetic Puzzle Matrix
                  </p>
                </div>
                {import.meta.env.DEV && (
                  <span className="ml-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold px-1.5 py-0.5 rounded text-[10px] leading-none select-none">
                    DEV
                  </span>
                )}
              </div>

              {/* Action Buttons: Undo, Redo, Close */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={onUndo}
                  title="元に戻す (Ctrl+Z)"
                  className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                    canUndo
                      ? "hover:bg-slate-800 text-slate-200 active:scale-90"
                      : "opacity-30 cursor-not-allowed text-slate-500"
                  }`}
                >
                  <Undo2Icon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={onRedo}
                  title="やり直す (Ctrl+Y)"
                  className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                    canRedo
                      ? "hover:bg-slate-800 text-slate-200 active:scale-90"
                      : "opacity-30 cursor-not-allowed text-slate-500"
                  }`}
                >
                  <Redo2Icon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="閉じる (H)"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 custom-scrollbar text-xs">
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
                onGenerateGradientTheme={onGenerateGradientTheme}
              />
              <EffectsSection
                params={params}
                onParamChange={onParamChange}
              />
              <AutomationSection
                onRandomizeAll={onRandomizeAll}
                onStartNLoopRecord={onStartNLoopRecord}
              />
              <ExportSection
                onExportPng={onExportPng}
                onExportSvg={onExportSvg}
                onStartRecord={onStartRecord}
                onStopRecord={onStopRecord}
                onExportJson={onExportJson}
                onImportJson={onImportJson}
              />

              {/* Shortcuts Footer Badge */}
              <div className="pt-1 pb-2 text-[10px] text-slate-400 flex flex-wrap gap-2 items-center justify-center border-t border-slate-800/80">
                <span>
                  <span className="kbd-key">Space</span> ランダム
                </span>
                <span>
                  <span className="kbd-key">H</span> パネル
                </span>
                <span>
                  <span className="kbd-key">R</span> 録画開始
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
