import {
  CheckIcon,
  ChevronDownIcon,
  PaletteIcon,
  RefreshCwIcon,
  ShuffleIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  onShufflePaletteColors: () => void;
  onGenerateGradientTheme: (baseHex: string) => void;
}

export const ColorPaletteSection: React.FC<Props> = ({
  params,
  onParamChange,
  onApplyPalette,
  onPickRandomPalette,
  onShufflePaletteColors,
  onGenerateGradientTheme,
}) => {
  const [baseColor, setBaseColor] = useState("#38bdf8");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPalette =
    PRESET_COLOR_PALETTES[params.currentPaletteIndex] ||
    PRESET_COLOR_PALETTES[0];

  const getPaletteGradient = (
    palette: (typeof PRESET_COLOR_PALETTES)[number],
    angle = 90,
  ) => {
    if (!palette?.colors?.length) return "transparent";
    const hexes = palette.colors.map((c) => c.hex);
    if (hexes.length === 1) return hexes[0];
    return `linear-gradient(${angle}deg, ${hexes.join(", ")})`;
  };

  const getPaletteSoftGradient = (
    palette: (typeof PRESET_COLOR_PALETTES)[number],
    opacity = 0.25,
    angle = 90,
  ) => {
    if (!palette?.colors?.length) return "transparent";
    const stops = palette.colors.map((c) => {
      const [r, g, b] = c.rgb;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });
    if (stops.length === 1) return stops[0];
    return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleDropdownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("pointerdown", handleDropdownOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleDropdownOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="space-y-3 bg-white/50 backdrop-blur-md p-3.5 rounded-md border border-white/50 shadow-xs relative overflow-hidden">
      {/* Top accent line colored by current palette */}
      <div
        className="h-[3px] absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ background: getPaletteGradient(currentPalette, 90) }}
      />

      <div className="font-bold text-gray-900 flex items-center gap-2 text-xs pt-0.5">
        <PaletteIcon className="w-4 h-4 text-gray-700" />
        カラーパレット &amp; テーマ
      </div>

      {/* Palette Selector with Color Preview Swatches */}
      <div
        className="space-y-1 relative"
        title="カラーパレットのテーマを選択します"
        ref={dropdownRef}
      >
        <span className="text-gray-600 font-medium block mb-1 text-[11px]">
          プリセットパレット
        </span>

        {/* Dropdown Trigger Button - Colored by current palette */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          style={{
            background: getPaletteSoftGradient(currentPalette, 0.35, 90),
          }}
          className="w-full border border-gray-300/80 hover:border-gray-400 text-gray-900 rounded p-2 text-xs focus:ring-1 focus:ring-gray-800 focus:outline-none cursor-pointer flex items-center justify-between gap-2 shadow-xs transition"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
            {/* Swatch preview with fadeout when many colors */}
            <div
              className="flex gap-0.5 flex-shrink-0 p-0.5 bg-white/80 backdrop-blur-xs rounded border border-gray-200 shadow-2xs max-w-[108px] overflow-hidden"
              style={
                currentPalette.colors.length > 5
                  ? {
                      maskImage:
                        "linear-gradient(to right, black calc(100% - 20px), transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to right, black calc(100% - 20px), transparent 100%)",
                    }
                  : undefined
              }
            >
              {currentPalette.colors.map((c) => (
                <div
                  key={c.hex}
                  className="w-3.5 h-3.5 rounded-[2px] flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <span className="font-semibold truncate text-gray-900 text-[11px] drop-shadow-2xs min-w-0 flex-1">
              {currentPalette.title}
            </span>
          </div>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Overlay */}
        {isDropdownOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-md shadow-2xl max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1.5">
            {PRESET_COLOR_PALETTES.map((pal, idx) => {
              const isSelected = idx === params.currentPaletteIndex;
              return (
                <button
                  type="button"
                  key={`${pal.title}_${idx}`}
                  onClick={() => {
                    onApplyPalette(idx);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    background: isSelected
                      ? getPaletteSoftGradient(pal, 0.45, 90)
                      : getPaletteSoftGradient(pal, 0.18, 90),
                  }}
                  className={`w-full text-left p-2.5 rounded-md flex flex-col gap-1.5 transition-all cursor-pointer text-xs border relative overflow-hidden ${
                    isSelected
                      ? "border-gray-900/60 shadow-sm ring-1 ring-gray-900/30"
                      : "border-gray-200/60 hover:border-gray-400 hover:brightness-95"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 relative z-10">
                    <span className="font-bold text-[11px] text-gray-900 drop-shadow-2xs truncate min-w-0 flex-1">
                      {pal.title}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-900 border border-gray-200/80 shadow-2xs flex-shrink-0">
                        <CheckIcon className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        選択中
                      </span>
                    )}
                  </div>

                  {/* Swatches & Comment */}
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div
                      className="flex gap-1 flex-shrink-0 p-0.5 bg-white/80 backdrop-blur-xs rounded border border-gray-200/80 shadow-2xs max-w-[130px] overflow-hidden"
                      style={
                        pal.colors.length > 5
                          ? {
                              maskImage:
                                "linear-gradient(to right, black calc(100% - 18px), transparent 100%)",
                              WebkitMaskImage:
                                "linear-gradient(to right, black calc(100% - 18px), transparent 100%)",
                            }
                          : undefined
                      }
                    >
                      {pal.colors.map((c) => (
                        <div
                          key={c.hex}
                          className="w-4 h-4 rounded-[2px] border border-black/10 shadow-2xs flex-shrink-0"
                          style={{ backgroundColor: c.hex }}
                          title={`${c.name} (${c.hex})`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-700 font-medium truncate text-right bg-white/70 backdrop-blur-xs px-1.5 py-0.5 rounded border border-white/60 min-w-0 flex-1">
                      {pal.comment}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Palette Colors Display - Colored by current palette */}
      <div className="space-y-1.5 pt-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-600 font-medium">
            現在のパレット色:
          </span>
          <span className="text-[10px] font-semibold text-gray-700 bg-white/75 backdrop-blur-xs px-2 py-0.5 rounded border border-white/60 truncate max-w-[150px]">
            {currentPalette.title} ({params.activeColorPalette.length}色)
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 p-2 rounded border border-gray-200/80 shadow-xs relative overflow-hidden transition-all duration-300"
          style={{
            background: getPaletteSoftGradient(currentPalette, 0.3, 90),
          }}
        >
          <div
            className="flex gap-1.5 overflow-x-auto custom-scrollbar pt-0.5 pb-2.5 px-0.5 flex-1 min-w-0"
            style={
              params.activeColorPalette.length > 7
                ? {
                    maskImage:
                      "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
                  }
                : undefined
            }
          >
            {params.activeColorPalette.map((hex, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: palette swatches
                key={`${hex}_${idx}`}
                className="w-5 h-5 rounded border border-black/15 flex-shrink-0 shadow-xs transition-transform hover:scale-110 cursor-default"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPickRandomPalette}
          title="ランダムにパレットを選択します"
          className="flex-1 bg-white/70 hover:bg-white/95 text-gray-800 border border-gray-300/80 py-1.5 rounded text-xs transition flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-xs"
        >
          <ShuffleIcon className="w-3.5 h-3.5" />
          ランダムパレット
        </button>
        <button
          type="button"
          onClick={onShufflePaletteColors}
          title="現在のパレット内で色割り当てをシャッフルします"
          className="flex-1 bg-white/70 hover:bg-white/95 text-gray-800 border border-gray-300/80 py-1.5 rounded text-xs transition flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-xs"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          配色シャッフル
        </button>
      </div>

      {/* Monochrome Piece Mode */}
      <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-700 font-semibold">
            単色ピースモード (Monochrome)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={params.singlePieceColorHex}
              onChange={(e) => {
                onParamChange("singlePieceColorHex", e.target.value);
                if (!params.monochromeFillActive) {
                  onParamChange("monochromeFillActive", true);
                }
              }}
              className="w-6 h-6 rounded border border-gray-300 bg-white cursor-pointer"
              title="単色ピースの色"
            />
            <label
              className="relative inline-flex items-center cursor-pointer select-none"
              title="全ピースを単色にして境界線のスライドを強調します"
            >
              <input
                type="checkbox"
                checked={params.monochromeFillActive}
                className="sr-only peer"
                onChange={(e) =>
                  onParamChange("monochromeFillActive", e.target.checked)
                }
              />
              <div className="w-9 h-5 bg-gray-200/80 border border-gray-300/80 rounded-full peer peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
            </label>
          </div>
        </div>
        <p className="text-[9.5px] text-gray-500 leading-tight">
          全ピースを1色に固定し、境界線スライドをグラフィカルに強調
        </p>
      </div>

      {/* Reactive Fade Coloring Mode */}
      <div className="pt-2 border-t border-gray-200/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-700 font-semibold">
            動的フェード色づきモード (Reactive Fade)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={params.reactiveBaseColorHex}
              onChange={(e) =>
                onParamChange("reactiveBaseColorHex", e.target.value)
              }
              className="w-6 h-6 rounded border border-gray-300 bg-white cursor-pointer"
              title="休止時の単色ベースカラー"
            />
            <label
              className="relative inline-flex items-center cursor-pointer select-none"
              title="2辺が動いたピースのみ色づき、一定時間でフェードアウトします"
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
        </div>
        <p className="text-[9.5px] text-gray-500 leading-tight">
          最初は単色、持つ2辺が動いたピースだけパレット色で発光し、徐々に元の単色へフェードアウト
        </p>

        {params.reactiveFadeMode && (
          <div className="space-y-1 bg-white/60 p-2 rounded border border-gray-200/60">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600 font-medium">
                フェードアウト時間 (Fade Duration)
              </span>
              <span className="font-mono text-gray-800">
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
          </div>
        )}
      </div>

      {/* Background Color */}
      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-700 font-semibold block">
            背景色 (Background)
          </span>
          <span className="text-[9.5px] text-gray-500">
            ※背景色はピース配色から自動除外
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-gray-500">
            {params.backgroundColorHex}
          </span>
          <input
            type="color"
            value={params.backgroundColorHex}
            onChange={(e) =>
              onParamChange("backgroundColorHex", e.target.value)
            }
            className="w-7 h-7 rounded border border-gray-300 bg-white cursor-pointer"
          />
        </div>
      </div>

      {/* Gradient Theme Generator */}
      <div className="pt-2 border-t border-gray-200/60 space-y-2">
        <span className="text-gray-600 block font-medium text-[11px]">
          単色からグラデーションテーマを作成
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer bg-white"
            title="ベース色を選択"
          />
          <button
            type="button"
            onClick={() => onGenerateGradientTheme(baseColor)}
            title="選択した色から複数のグラデーション色を生成します"
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-1.5 rounded text-xs transition font-medium shadow-sm cursor-pointer"
          >
            グラデーション生成
          </button>
        </div>
      </div>
    </div>
  );
};
