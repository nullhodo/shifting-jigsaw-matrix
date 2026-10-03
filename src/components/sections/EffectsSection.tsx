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
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Texture & Debug</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">Visuals</span>
      </div>

      {/* Grain Texture */}
      <div className="space-y-2">
        <label
          htmlFor="cb-grain"
          className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300"
        >
          <input
            id="cb-grain"
            type="checkbox"
            checked={params.grainActive}
            onChange={(e) =>
              onParamChange("grainActive", e.target.checked)
            }
            className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>Grain Texture (微細なざらつき質感)</span>
        </label>

        {params.grainActive && (
          <div className="space-y-1 pl-5">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="input-grain-int" className="text-slate-400">
                Grain Intensity
              </label>
              <span className="font-mono text-sky-400">
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
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Debug Mode Overlay */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <label
          htmlFor="cb-debug"
          className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium"
        >
          <input
            id="cb-debug"
            type="checkbox"
            checked={params.debugModeActive}
            onChange={(e) =>
              onParamChange("debugModeActive", e.target.checked)
            }
            className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>Debug Overlay</span>
          <span className="kbd-key ml-0.5">D</span>
        </label>
        <span
          className={`text-[10px] font-mono font-bold ${
            params.debugModeActive ? "text-sky-400" : "text-slate-500"
          }`}
        >
          {params.debugModeActive ? "ON" : "OFF"}
        </span>
      </div>
    </section>
  );
};
