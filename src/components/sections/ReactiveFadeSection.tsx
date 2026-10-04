import { FlameIcon, SparklesIcon } from "lucide-react";
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

export const ReactiveFadeSection: React.FC<Props> = ({
  params,
  onParamChange,
}) => {
  const triggerEdges = params.reactiveTriggerEdges ?? 2;

  return (
    <div className="space-y-3 bg-white/50 backdrop-blur-md p-3.5 rounded-md border border-white/50 shadow-xs relative overflow-hidden">
      {/* Top accent line when active */}
      <div
        className={`h-[2px] absolute top-0 left-0 right-0 transition-all duration-300 ${
          params.reactiveFadeMode
            ? "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 opacity-100"
            : "bg-transparent opacity-0"
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-bold text-gray-900 flex items-center gap-2 text-xs">
          <FlameIcon
            className={`w-4 h-4 transition-colors ${
              params.reactiveFadeMode
                ? "text-amber-600 fill-amber-500/20"
                : "text-gray-600"
            }`}
          />
          <span>動的フェード発光 (Reactive Fade)</span>
        </div>

        <label
          className="relative inline-flex items-center cursor-pointer select-none"
          title="境界線移動に連動したピース発光＆フェードアウトのON/OFF"
        >
          <input
            type="checkbox"
            checked={params.reactiveFadeMode}
            className="sr-only peer"
            onChange={(e) =>
              onParamChange("reactiveFadeMode", e.target.checked)
            }
          />
          <div className="w-9 h-5 bg-gray-200/80 border border-gray-300/80 rounded-full peer peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
        </label>
      </div>

      <p className="text-[9.5px] text-gray-500 leading-tight">
        移動した境界線を持つピースがパレット色で滑らかに発光し、移動後に休止時の単色へフェードアウト
      </p>

      {/* Configuration Details (Active when reactiveFadeMode is ON) */}
      {params.reactiveFadeMode && (
        <div className="space-y-3 pt-1">
          {/* Trigger Condition: 1 edge vs 2 edges */}
          <div className="space-y-1.5 bg-white/60 p-2.5 rounded-md border border-gray-200/70">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-700 font-semibold flex items-center gap-1.5">
                <SparklesIcon className="w-3 h-3 text-amber-600" />
                発光トリガー条件
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {triggerEdges === 1 ? "1辺移動" : "2辺移動"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onParamChange("reactiveTriggerEdges", 1)}
                className={`p-2 rounded text-left border transition cursor-pointer flex flex-col gap-0.5 ${
                  triggerEdges === 1
                    ? "bg-white border-emerald-500/80 ring-1 ring-emerald-500/30 shadow-xs"
                    : "bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300 text-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold ${
                      triggerEdges === 1
                        ? "text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    1辺以上
                  </span>
                  {triggerEdges === 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-[9px] text-gray-500 leading-tight">
                  周囲のいずれか1辺が移動したピース
                </span>
              </button>

              <button
                type="button"
                onClick={() => onParamChange("reactiveTriggerEdges", 2)}
                className={`p-2 rounded text-left border transition cursor-pointer flex flex-col gap-0.5 ${
                  triggerEdges === 2
                    ? "bg-white border-emerald-500/80 ring-1 ring-emerald-500/30 shadow-xs"
                    : "bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300 text-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold ${
                      triggerEdges === 2
                        ? "text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    2辺以上
                  </span>
                  {triggerEdges === 2 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-[9px] text-gray-500 leading-tight">
                  縦横2辺（または合計2辺以上）が移動
                </span>
              </button>
            </div>
          </div>

          {/* Base Color Picker */}
          <div className="flex items-center justify-between p-2 rounded-md bg-white/60 border border-gray-200/70">
            <div>
              <span className="text-[11px] text-gray-700 font-semibold block">
                休止時ベースカラー
              </span>
              <span className="text-[9px] text-gray-500">
                発光していない静止ピースの色
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-gray-600">
                {params.reactiveBaseColorHex}
              </span>
              <input
                type="color"
                value={params.reactiveBaseColorHex}
                onChange={(e) =>
                  onParamChange("reactiveBaseColorHex", e.target.value)
                }
                className="w-6 h-6 rounded border border-gray-300 bg-white cursor-pointer"
                title="休止時の単色ベースカラー"
              />
            </div>
          </div>

          {/* Fade Timing Sliders */}
          <div className="space-y-2 bg-white/60 p-2.5 rounded-md border border-gray-200/70">
            {/* Fade In Duration Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-700 font-medium">
                  色づき時間 (Fade In)
                </span>
                <span className="font-mono font-semibold text-gray-900">
                  {params.fadeInDurationMs} ms
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={1200}
                step={50}
                value={params.fadeInDurationMs}
                onChange={(e) =>
                  onParamChange(
                    "fadeInDurationMs",
                    Number.parseFloat(e.target.value),
                  )
                }
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-gray-500 block">
                移動開始時のイージング時間（急激な色の飛びを防止）
              </span>
            </div>

            {/* Fade Out Duration Slider */}
            <div className="space-y-1 pt-1 border-t border-gray-200/60">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-700 font-medium">
                  消滅時間 (Fade Out)
                </span>
                <span className="font-mono font-semibold text-gray-900">
                  {params.fadeDurationMs} ms
                </span>
              </div>
              <input
                type="range"
                min={400}
                max={4000}
                step={100}
                value={params.fadeDurationMs}
                onChange={(e) =>
                  onParamChange(
                    "fadeDurationMs",
                    Number.parseFloat(e.target.value),
                  )
                }
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-gray-500 block">
                移動完了後に元の単色へ戻るまでの持続時間
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
