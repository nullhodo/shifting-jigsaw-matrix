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
    <div className="space-y-3 bg-white/50 backdrop-blur-md p-3.5 rounded-md border border-white/50 shadow-xs">
      <div className="font-bold text-gray-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-gray-700" />
          <span>境界線スライド &amp; モーション</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          Kinetic Slide
        </span>
      </div>

      <div className="space-y-2">
        {/* Motion Probability */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-motion-prob">
              活動確率 (Active Probability)
            </label>
            <span className="text-gray-900 font-semibold">
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Step Interval */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-step-int">
              判定間隔 (Step Interval)
            </label>
            <span className="text-gray-900 font-semibold">
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Easing Duration */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-ease-dur">
              移動時間 (Easing Duration)
            </label>
            <span className="text-gray-900 font-semibold">
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Stroke Width */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-stroke-w">線の太さ (Stroke Width)</label>
            <span className="text-gray-900 font-semibold">
              {params.strokeWidth.toFixed(1)}px
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
              onParamChange(
                "strokeWidth",
                Number.parseFloat(e.target.value),
              )
            }
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Stroke Color */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60">
          <label
            htmlFor="input-stroke-col"
            className="text-[11px] text-gray-600 font-medium"
          >
            境界線の色 (Stroke Color)
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-gray-500">
              {params.strokeColorHex}
            </span>
            <input
              id="input-stroke-col"
              type="color"
              value={params.strokeColorHex}
              onChange={(e) =>
                onParamChange("strokeColorHex", e.target.value)
              }
              className="w-7 h-7 rounded border border-gray-300 bg-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
