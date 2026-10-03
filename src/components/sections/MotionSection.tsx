import { ActivityIcon } from "lucide-react";
import type React from "react";
import type {
  JigsawParamValue,
  JigsawParameters,
} from "../../types/jigsaw";

interface Props {
  params: JigsawParameters;
  onParamChange: (
    key: keyof JigsawParameters,
    val: JigsawParamValue,
  ) => void;
}

export const MotionSection: React.FC<Props> = ({
  params,
  onParamChange,
}) => {
  return (
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <ActivityIcon className="w-3.5 h-3.5" />
          <span>Boundary Motion</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">
          Dynamic Slide
        </span>
      </div>

      {/* Motion Probability */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-motion-prob" className="text-slate-300">
            Active Probability (活動確率)
          </label>
          <span className="font-mono text-sky-400">
            {params.motionProbability.toFixed(2)}
          </span>
        </div>
        <input
          id="input-motion-prob"
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={params.motionProbability}
          onChange={(e) =>
            onParamChange(
              "motionProbability",
              Number.parseFloat(e.target.value),
            )
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Step Interval */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-step-int" className="text-slate-300">
            Step Interval (判定間隔)
          </label>
          <span className="font-mono text-sky-400">
            {params.stepIntervalMilliseconds}ms
          </span>
        </div>
        <input
          id="input-step-int"
          type="range"
          min="400"
          max="3000"
          step="100"
          value={params.stepIntervalMilliseconds}
          onChange={(e) =>
            onParamChange(
              "stepIntervalMilliseconds",
              Number.parseInt(e.target.value, 10),
            )
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Easing Duration */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-ease-dur" className="text-slate-300">
            Easing Duration (移動時間)
          </label>
          <span className="font-mono text-sky-400">
            {params.easingDurationMilliseconds}ms
          </span>
        </div>
        <input
          id="input-ease-dur"
          type="range"
          min="200"
          max="1500"
          step="50"
          value={params.easingDurationMilliseconds}
          onChange={(e) =>
            onParamChange(
              "easingDurationMilliseconds",
              Number.parseInt(e.target.value, 10),
            )
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Stroke Width */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-stroke-w" className="text-slate-300">
            Stroke Width (線の太さ)
          </label>
          <span className="font-mono text-sky-400">
            {params.strokeWidth.toFixed(1)}
          </span>
        </div>
        <input
          id="input-stroke-w"
          type="range"
          min="0.5"
          max="8.0"
          step="0.5"
          value={params.strokeWidth}
          onChange={(e) =>
            onParamChange("strokeWidth", Number.parseFloat(e.target.value))
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Stroke Color */}
      <div className="flex items-center justify-between pt-1">
        <label
          htmlFor="input-stroke-col"
          className="text-xs text-slate-300"
        >
          Stroke Color
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-400">
            {params.strokeColorHex}
          </span>
          <input
            id="input-stroke-col"
            type="color"
            value={params.strokeColorHex}
            onChange={(e) =>
              onParamChange("strokeColorHex", e.target.value)
            }
            className="w-6 h-6 bg-transparent border-0 rounded cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
};
