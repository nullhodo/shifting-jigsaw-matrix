import { GridIcon } from "lucide-react";
import type React from "react";
import type {
  JigsawParamValue,
  JigsawParameters,
  TabShapeStyle,
} from "../../types/jigsaw";

interface Props {
  params: JigsawParameters;
  onParamChange: (
    key: keyof JigsawParameters,
    val: JigsawParamValue,
  ) => void;
}

export const GridScaleSection: React.FC<Props> = ({
  params,
  onParamChange,
}) => {
  return (
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <GridIcon className="w-3.5 h-3.5" />
          <span>Grid & Jigsaw Scale</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">M × N</span>
      </div>

      {/* Columns (M) */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-cols" className="text-slate-300">
            Columns (M 列)
          </label>
          <span className="font-mono text-sky-400">{params.columns}</span>
        </div>
        <input
          id="input-cols"
          type="range"
          min="2"
          max="16"
          step="1"
          value={params.columns}
          onChange={(e) =>
            onParamChange("columns", Number.parseInt(e.target.value, 10))
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Rows (N) */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-rows" className="text-slate-300">
            Rows (N 行)
          </label>
          <span className="font-mono text-sky-400">{params.rows}</span>
        </div>
        <input
          id="input-rows"
          type="range"
          min="2"
          max="16"
          step="1"
          value={params.rows}
          onChange={(e) =>
            onParamChange("rows", Number.parseInt(e.target.value, 10))
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Tab Shape Style */}
      <div className="space-y-1">
        <label
          htmlFor="select-tab-shape"
          className="block text-xs font-medium text-slate-300"
        >
          Tab Shape Style (突起の形状)
        </label>
        <select
          id="select-tab-shape"
          value={params.tabShapeStyle}
          onChange={(e) =>
            onParamChange("tabShapeStyle", e.target.value as TabShapeStyle)
          }
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
        >
          <option value="classic">
            Classic Jigsaw (定番の丸み・くびれ)
          </option>
          <option value="bulb">
            Bulbous Balloon (深いくびれと風船型)
          </option>
          <option value="sharp">Sharp Wedge (鋭角・くさび型)</option>
          <option value="trapezoid">
            Trapezoid Block (台形・ブロック調)
          </option>
          <option value="gentle">Gentle Wave (なだらかな波型)</option>
        </select>
      </div>

      {/* Tab Size */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-tab-size" className="text-slate-300">
            Tab Size (突起の深さ)
          </label>
          <span className="font-mono text-sky-400">
            {params.tabSizeFactor.toFixed(2)}
          </span>
        </div>
        <input
          id="input-tab-size"
          type="range"
          min="0.04"
          max="0.32"
          step="0.01"
          value={params.tabSizeFactor}
          onChange={(e) =>
            onParamChange(
              "tabSizeFactor",
              Number.parseFloat(e.target.value),
            )
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Roundness */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="input-tab-roundness" className="text-slate-300">
            Roundness (突起の丸み)
          </label>
          <span className="font-mono text-sky-400">
            {params.tabRoundness.toFixed(2)}
          </span>
        </div>
        <input
          id="input-tab-roundness"
          type="range"
          min="0.1"
          max="0.6"
          step="0.02"
          value={params.tabRoundness}
          onChange={(e) =>
            onParamChange(
              "tabRoundness",
              Number.parseFloat(e.target.value),
            )
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </section>
  );
};
