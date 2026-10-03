import { useAtom } from "jotai";
import { PlayCircleIcon, RepeatIcon, ShuffleIcon } from "lucide-react";
import type React from "react";
import {
  autoRandomIntervalMsAtom,
  isAutoRandomActiveAtom,
  isLoopRecordingActiveAtom,
  randomTargetsAtom,
  targetLoopsCountAtom,
} from "../../state/jigsawStore";
import type { RandomTargets } from "../../types/jigsaw";

interface Props {
  onRandomizeAll: () => void;
  onStartNLoopRecord: (loopCount: number) => void;
}

export const AutomationSection: React.FC<Props> = ({
  onRandomizeAll,
  onStartNLoopRecord,
}) => {
  const [randomTargets, setRandomTargets] = useAtom(randomTargetsAtom);
  const [isAutoRandom, setIsAutoRandom] = useAtom(isAutoRandomActiveAtom);
  const [intervalMs, setIntervalMs] = useAtom(autoRandomIntervalMsAtom);
  const [targetLoops, setTargetLoops] = useAtom(targetLoopsCountAtom);
  const [isLoopRec] = useAtom(isLoopRecordingActiveAtom);

  const toggleTarget = (key: keyof RandomTargets) => {
    setRandomTargets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <RepeatIcon className="w-3.5 h-3.5" />
          <span>Randomize & Automation</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">Loop</span>
      </div>

      {/* Immediate Random Button */}
      <button
        type="button"
        onClick={onRandomizeAll}
        className="w-full py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 rounded font-semibold transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
      >
        <ShuffleIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>Randomize Selected Now (Space)</span>
      </button>

      {/* Random Target Toggles */}
      <div className="space-y-1.5 pt-1 text-xs text-slate-300">
        <span className="text-[11px] text-slate-400">Random Targets:</span>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={randomTargets.grid}
              onChange={() => toggleTarget("grid")}
              className="rounded bg-slate-800 border-slate-700 text-sky-500"
            />
            <span>Grid Cols/Rows</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={randomTargets.tabs}
              onChange={() => toggleTarget("tabs")}
              className="rounded bg-slate-800 border-slate-700 text-sky-500"
            />
            <span>Tab Shape/Depth</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={randomTargets.speed}
              onChange={() => toggleTarget("speed")}
              className="rounded bg-slate-800 border-slate-700 text-sky-500"
            />
            <span>Slide Speed</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={randomTargets.palette}
              onChange={() => toggleTarget("palette")}
              className="rounded bg-slate-800 border-slate-700 text-sky-500"
            />
            <span>Palette Theme</span>
          </label>
        </div>
      </div>

      {/* Auto Cycle */}
      <div className="space-y-1 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="cb-auto-rand"
            className="flex items-center gap-2 cursor-pointer font-medium text-slate-300"
          >
            <input
              id="cb-auto-rand"
              type="checkbox"
              checked={isAutoRandom}
              onChange={(e) => setIsAutoRandom(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500"
            />
            <span>Auto Cycle (自動ランダム)</span>
          </label>
          <span className="font-mono text-sky-400">{intervalMs}ms</span>
        </div>
        <input
          id="input-auto-rand"
          type="range"
          min="1000"
          max="12000"
          step="500"
          value={intervalMs}
          onChange={(e) =>
            setIntervalMs(Number.parseInt(e.target.value, 10))
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* N-Loop Exact Recording */}
      <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="select-n-loops"
            className="text-slate-300 font-medium"
          >
            Exact N-Loops Record
          </label>
          <select
            id="select-n-loops"
            value={targetLoops}
            onChange={(e) =>
              setTargetLoops(Number.parseInt(e.target.value, 10))
            }
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 font-mono text-xs"
          >
            <option value="1">1 Loop</option>
            <option value="2">2 Loops</option>
            <option value="3">3 Loops</option>
            <option value="4">4 Loops</option>
            <option value="6">6 Loops</option>
          </select>
        </div>
        <button
          type="button"
          disabled={isLoopRec}
          onClick={() => onStartNLoopRecord(targetLoops)}
          className={`w-full py-1.5 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1.5 border ${
            isLoopRec
              ? "bg-rose-950/40 border-rose-800 text-rose-400 cursor-not-allowed opacity-60"
              : "bg-rose-950/70 hover:bg-rose-900 border-rose-600/70 text-rose-200 cursor-pointer active:scale-98"
          }`}
        >
          <PlayCircleIcon className="w-3.5 h-3.5 text-rose-400" />
          <span>
            {isLoopRec
              ? "Recording Loops in Progress..."
              : `Record Exact ${targetLoops} Loops (Auto Stop)`}
          </span>
        </button>
      </div>
    </section>
  );
};
