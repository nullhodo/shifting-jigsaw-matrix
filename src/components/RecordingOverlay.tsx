import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { CircleDotIcon, VideoIcon } from "lucide-react";
import type React from "react";
import { recordingStateAtom } from "../state/jigsawStore";

export const RecordingOverlay: React.FC = () => {
  const [recState] = useAtom(recordingStateAtom);

  if (!recState.isRecording) return null;

  const minutes = String(
    Math.floor(recState.elapsedSeconds / 60),
  ).padStart(2, "0");
  const seconds = String(recState.elapsedSeconds % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2 bg-rose-950/90 text-rose-200 border border-rose-500/80 rounded-full shadow-2xl backdrop-blur-md pointer-events-none"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>

        <div className="flex items-center gap-1.5 font-bold text-xs tracking-wider uppercase text-rose-300">
          <VideoIcon className="w-3.5 h-3.5" />
          <span>REC 60FPS</span>
        </div>

        <span className="font-mono text-xs font-semibold text-rose-100">
          {minutes}:{seconds}
        </span>

        {recState.isLoopMode && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-rose-500/50 text-[11px] font-semibold text-rose-300">
            <CircleDotIcon className="w-3 h-3 text-rose-400 animate-spin" />
            <span>
              Loop {recState.currentLoop ?? 1} / {recState.totalLoops ?? 1}
            </span>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
};
