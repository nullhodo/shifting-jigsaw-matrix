import { SparklesIcon } from "lucide-react";
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

export const EffectsSection: React.FC<Props> = ({
  params,
  onParamChange,
}) => {
  return (
    <div className="space-y-3 bg-white/50 backdrop-blur-md p-3.5 rounded-md border border-white/50 shadow-xs">
      <div className="font-bold text-gray-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-gray-700" />
          <span>質感 &amp; デバッグ設定</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          Visuals
        </span>
      </div>

      {/* Grain Texture */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-700 font-semibold block">
              グレイン質感 (Grain)
            </span>
            <span className="text-[9.5px] text-gray-500">
              アナログフィルムのような微小粒子ノイズ
            </span>
          </div>
          <label
            className="relative inline-flex items-center cursor-pointer select-none"
            title="グレイン質感のON/OFF"
          >
            <input
              type="checkbox"
              checked={params.grainActive}
              className="sr-only peer"
              onChange={(e) =>
                onParamChange("grainActive", e.target.checked)
              }
            />
            <div className="w-9 h-5 bg-gray-200/80 border border-gray-300/80 rounded-full peer peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
          </label>
        </div>

        {params.grainActive && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-gray-600 font-medium">
              <label htmlFor="input-grain-int">グレイン強度</label>
              <span className="text-gray-900 font-semibold">
                {params.grainIntensity.toFixed(2)}
              </span>
            </div>
            <input
              id="input-grain-int"
              type="range"
              min="0.02"
              max="0.4"
              step="0.01"
              value={params.grainIntensity}
              onChange={(e) =>
                onParamChange(
                  "grainIntensity",
                  Number.parseFloat(e.target.value),
                )
              }
              className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Debug Mode Overlay */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
        <div>
          <span className="text-[11px] text-gray-700 font-semibold block">
            デバッグオーバーレイ (D)
          </span>
          <span className="text-[9.5px] text-gray-500">
            境界線のスライド座標・制御点を表示
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              params.debugModeActive
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {params.debugModeActive ? "ON" : "OFF"}
          </span>
          <label
            className="relative inline-flex items-center cursor-pointer select-none"
            title="デバッグ表示のON/OFF (Dキー)"
          >
            <input
              type="checkbox"
              checked={params.debugModeActive}
              className="sr-only peer"
              onChange={(e) =>
                onParamChange("debugModeActive", e.target.checked)
              }
            />
            <div className="w-9 h-5 bg-gray-200/80 border border-gray-300/80 rounded-full peer peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
          </label>
        </div>
      </div>
    </div>
  );
};
