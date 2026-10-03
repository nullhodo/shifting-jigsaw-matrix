import { DicesIcon, PaletteIcon, Wand2Icon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { PRESET_COLOR_PALETTES } from "../../constants/palettes";
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
  onApplyPalette: (idx: number) => void;
  onPickRandomPalette: () => void;
  onGenerateGradientTheme: (baseHex: string) => void;
}

export const ColorPaletteSection: React.FC<Props> = ({
  params,
  onParamChange,
  onApplyPalette,
  onPickRandomPalette,
  onGenerateGradientTheme,
}) => {
  const [baseGradientColor, setBaseGradientColor] = useState("#38bdf8");

  return (
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <PaletteIcon className="w-3.5 h-3.5" />
          <span>Palette & Cell Colors</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">Fills</span>
      </div>

      {/* Palette Select */}
      <div className="space-y-1">
        <label
          htmlFor="select-preset-palette"
          className="block text-xs font-medium text-slate-300"
        >
          Preset Palette
        </label>
        <select
          id="select-preset-palette"
          value={params.currentPaletteIndex}
          onChange={(e) =>
            onApplyPalette(Number.parseInt(e.target.value, 10))
          }
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
        >
          {PRESET_COLOR_PALETTES.map((p, idx) => (
            <option key={`${p.title}_${idx}`} value={idx}>
              {p.title} ({p.colors.length}色)
            </option>
          ))}
        </select>
      </div>

      {/* Random Palette Button */}
      <button
        type="button"
        onClick={onPickRandomPalette}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors flex items-center justify-center gap-1.5 text-xs border border-slate-700/60 cursor-pointer active:scale-98"
      >
        <DicesIcon className="w-3.5 h-3.5 text-sky-400" />
        <span>Random Palette</span>
      </button>

      {/* Color Swatches */}
      <div className="space-y-1">
        <span className="text-[11px] text-slate-400">Palette Colors:</span>
        <div className="flex flex-wrap gap-1 p-1 bg-slate-950/80 rounded border border-slate-800 max-h-24 overflow-y-auto custom-scrollbar">
          {params.activeColorPalette.map((colorHex, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static preview swatches
              key={`${colorHex}_${idx}`}
              className="w-5 h-5 rounded border border-slate-700/80 shadow-sm shrink-0"
              style={{ backgroundColor: colorHex }}
              title={colorHex}
            />
          ))}
        </div>
      </div>

      {/* Monochrome Piece Mode */}
      <div className="space-y-1 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label
            htmlFor="cb-monochrome"
            className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300"
          >
            <input
              id="cb-monochrome"
              type="checkbox"
              checked={params.monochromeFillActive}
              onChange={(e) =>
                onParamChange("monochromeFillActive", e.target.checked)
              }
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Monochrome Pieces (単色モード)</span>
          </label>
          <input
            type="color"
            value={params.singlePieceColorHex}
            onChange={(e) => {
              onParamChange("singlePieceColorHex", e.target.value);
              if (!params.monochromeFillActive) {
                onParamChange("monochromeFillActive", true);
              }
            }}
            className="w-6 h-6 bg-transparent border-0 rounded cursor-pointer"
          />
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          全ピースを1色に固定し、境界線スライドをグラフィカルに強調
        </p>
      </div>

      {/* Background Color */}
      <div className="space-y-1 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label htmlFor="input-bg-col" className="text-xs text-slate-300">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              {params.backgroundColorHex}
            </span>
            <input
              id="input-bg-col"
              type="color"
              value={params.backgroundColorHex}
              onChange={(e) =>
                onParamChange("backgroundColorHex", e.target.value)
              }
              className="w-6 h-6 bg-transparent border-0 rounded cursor-pointer"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          ※背景色に選ばれた色はセル塗りつぶしから自動除外されます
        </p>
      </div>

      {/* Generate Monochromatic Gradient Theme */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300">
            Generate Theme from Base Color
          </span>
          <input
            type="color"
            value={baseGradientColor}
            onChange={(e) => setBaseGradientColor(e.target.value)}
            className="w-6 h-6 bg-transparent border-0 rounded cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={() => onGenerateGradientTheme(baseGradientColor)}
          className="w-full py-1.5 bg-sky-950/70 hover:bg-sky-900 border border-sky-600/60 text-sky-200 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <Wand2Icon className="w-3.5 h-3.5 text-sky-400" />
          <span>Create Gradient Theme</span>
        </button>
      </div>
    </section>
  );
};
