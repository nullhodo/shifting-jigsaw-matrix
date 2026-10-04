import { GridIcon, Link, Unlink } from "lucide-react";
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
    <div className="space-y-3 bg-white/50 backdrop-blur-md p-3.5 rounded-md border border-white/50 shadow-xs">
      <div className="font-bold text-gray-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <GridIcon className="w-4 h-4 text-gray-700" />
          <span>グリッド規模 &amp; ピース形状</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          {params.columns} × {params.rows}
        </span>
      </div>

      {/* 1:1 Piece Aspect Ratio Lock */}
      <div className="flex items-center justify-between p-2 bg-white/60 rounded border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          {params.keepSquarePieceAspect ? (
            <Link className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Unlink className="w-3.5 h-3.5 text-gray-400" />
          )}
          <div>
            <div className="text-[11px] text-gray-800 font-semibold">
              1:1 ピース比率維持
            </div>
            <div className="text-[9.5px] text-gray-500">
              極端な長方形化を防ぎ正方形に近づける
            </div>
          </div>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer select-none"
          title="ピースのアスペクト比を1:1近くに連動固定します"
        >
          <input
            type="checkbox"
            checked={params.keepSquarePieceAspect}
            className="sr-only peer"
            onChange={(e) =>
              onParamChange("keepSquarePieceAspect", e.target.checked)
            }
          />
          <div className="w-9 h-5 bg-gray-200/80 border border-gray-300/80 rounded-full peer peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
        </label>
      </div>

      <div className="space-y-2">
        {/* Columns (M) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label
              htmlFor="input-cols"
              className="flex items-center gap-1"
            >
              <span>列数 (M 列)</span>
              {params.keepSquarePieceAspect && (
                <span className="text-[9.5px] text-emerald-700 font-normal">
                  (連動)
                </span>
              )}
            </label>
            <span className="text-gray-900 font-semibold">
              {params.columns}
            </span>
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Rows (N) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label
              htmlFor="input-rows"
              className="flex items-center gap-1"
            >
              <span>行数 (N 行)</span>
              {params.keepSquarePieceAspect && (
                <span className="text-[9.5px] text-emerald-700 font-normal">
                  (連動)
                </span>
              )}
            </label>
            <span className="text-gray-900 font-semibold">
              {params.rows}
            </span>
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Tab Shape Style */}
        <div className="space-y-1 pt-1 border-t border-gray-200/60">
          <label
            htmlFor="select-tab-shape"
            className="text-[11px] text-gray-600 block font-medium"
          >
            突起スタイル (Tab Style)
          </label>
          <select
            id="select-tab-shape"
            value={params.tabShapeStyle}
            onChange={(e) =>
              onParamChange(
                "tabShapeStyle",
                e.target.value as TabShapeStyle,
              )
            }
            className="w-full bg-white/70 hover:bg-white/95 border border-gray-300/80 text-gray-900 rounded p-1.5 text-xs focus:ring-1 focus:ring-gray-900 focus:outline-none cursor-pointer shadow-2xs transition"
          >
            <option value="circular">
              Circular (円形ベース・微分可能な滑らか曲線)
            </option>
            <option value="classic">Classic (定番の丸み・くびれ)</option>
            <option value="bulb">Bulb (深いくびれと風船型)</option>
            <option value="sharp">Sharp Wedge (鋭角・くさび型)</option>
            <option value="trapezoid">
              Trapezoid Block (台形・ブロック調)
            </option>
            <option value="gentle">Gentle Wave (なだらかな波型)</option>
          </select>
        </div>

        {/* Tab Size */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-tab-size">突起の深さ (Tab Depth)</label>
            <span className="text-gray-900 font-semibold">
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>

        {/* Roundness */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600 font-medium">
            <label htmlFor="input-tab-roundness">
              突起の丸み (Roundness)
            </label>
            <span className="text-gray-900 font-semibold">
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
            className="w-full accent-emerald-600 bg-gray-200 rounded h-1.5 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
