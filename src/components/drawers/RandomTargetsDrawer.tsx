import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import {
  ActivityIcon,
  CheckSquareIcon,
  GridIcon,
  PaletteIcon,
  ShapesIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import type React from "react";
import {
  isRandomTargetsModalOpenAtom,
  randomTargetsAtom,
} from "../../state/jigsawStore";
import type { RandomTargets } from "../../types/jigsaw";

interface TargetGroup {
  title: string;
  icon: React.ReactNode;
  items: {
    key: keyof RandomTargets;
    label: string;
    desc: string;
  }[];
}

export const RandomTargetsDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(isRandomTargetsModalOpenAtom);
  const [randomTargets, setRandomTargets] = useAtom(randomTargetsAtom);

  const toggleTarget = (key: keyof RandomTargets) => {
    setRandomTargets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAll = (enable: boolean) => {
    setRandomTargets({
      columns: enable,
      rows: enable,
      tabShapeStyle: enable,
      tabSizeFactor: enable,
      tabRoundness: enable,
      motionProbability: enable,
      stepIntervalMilliseconds: enable,
      easingDurationMilliseconds: enable,
      strokeWidth: enable,
      palette: enable,
      paletteShuffle: enable,
      monochromeFillActive: enable,
      grainActive: enable,
    });
  };

  const selectGroup = (keys: (keyof RandomTargets)[], enable: boolean) => {
    setRandomTargets((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = enable;
      }
      return next;
    });
  };

  const targetGroups: TargetGroup[] = [
    {
      title: "グリッド & ピース規模",
      icon: <GridIcon className="w-3.5 h-3.5 text-gray-700" />,
      items: [
        {
          key: "columns",
          label: "列数 (M 列)",
          desc: "水平方向のピース分割数 (3〜10)",
        },
        {
          key: "rows",
          label: "行数 (N 行)",
          desc: "垂直方向のピース分割数 (3〜10)",
        },
      ],
    },
    {
      title: "タブ & 突起形状",
      icon: <ShapesIcon className="w-3.5 h-3.5 text-gray-700" />,
      items: [
        {
          key: "tabShapeStyle",
          label: "突起スタイル (Tab Style)",
          desc: "Classic, Bulb, Sharp, Trapezoid, Gentle",
        },
        {
          key: "tabSizeFactor",
          label: "突起の深さ (Tab Depth)",
          desc: "ジグソーピースの突起突出スケール",
        },
        {
          key: "tabRoundness",
          label: "突起の丸み (Roundness)",
          desc: "ベジェ曲線の制御点丸み",
        },
      ],
    },
    {
      title: "モーション & 境界線",
      icon: <ActivityIcon className="w-3.5 h-3.5 text-gray-700" />,
      items: [
        {
          key: "motionProbability",
          label: "活動確率 (Active Prob)",
          desc: "各ステップで境界線が動く確率 (0.3〜0.85)",
        },
        {
          key: "stepIntervalMilliseconds",
          label: "判定間隔 (Step Interval)",
          desc: "次の移動抽選までのミリ秒 (600〜2400ms)",
        },
        {
          key: "easingDurationMilliseconds",
          label: "移動時間 (Easing Duration)",
          desc: "スライド移動のアニメーション時間 (300〜900ms)",
        },
        {
          key: "strokeWidth",
          label: "境界線の太さ (Stroke Width)",
          desc: "ピース間のしきり線の線幅 (1.0〜5.0px)",
        },
      ],
    },
    {
      title: "カラー & 質感",
      icon: <PaletteIcon className="w-3.5 h-3.5 text-gray-700" />,
      items: [
        {
          key: "palette",
          label: "カラーパレット選定",
          desc: "プリセット配色からのランダム選定",
        },
        {
          key: "paletteShuffle",
          label: "配色シャッフル",
          desc: "選択パレット内の各色割り当てをシャッフル",
        },
        {
          key: "monochromeFillActive",
          label: "単色モード切替",
          desc: "単色ピースモードのランダム切替",
        },
        {
          key: "grainActive",
          label: "グレイン質感 (Grain)",
          desc: "微小ざらつき質感のON/OFF",
        },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -20, opacity: 0, scale: 0.96 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-80 h-full bg-white/65 backdrop-blur-xl border border-white/50 rounded-md shadow-2xl flex flex-col text-gray-900 overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-gray-200/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
              <SlidersHorizontalIcon className="w-4 h-4 text-gray-700" />
              ランダム対象の選択
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-900 p-1 rounded hover:bg-gray-200/50 transition cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
              <span className="text-gray-600 text-[11px] font-semibold">
                一括操作
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="px-2 py-0.5 bg-white/70 border border-gray-300/80 hover:bg-white/95 text-gray-800 rounded text-[11px] font-medium transition cursor-pointer shadow-xs"
                >
                  全選択
                </button>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="px-2 py-0.5 bg-white/70 border border-gray-300/80 hover:bg-white/95 text-gray-600 rounded text-[11px] font-medium transition cursor-pointer shadow-xs"
                >
                  全解除
                </button>
              </div>
            </div>

            {/* Groups */}
            <div className="space-y-3">
              {targetGroups.map((group) => {
                const groupKeys = group.items.map((i) => i.key);
                const allSelected = groupKeys.every(
                  (k) => randomTargets[k],
                );

                return (
                  <div
                    key={group.title}
                    className="bg-white/50 backdrop-blur-md p-3 rounded-md border border-white/50 space-y-2 shadow-xs"
                  >
                    <div className="font-bold text-gray-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {group.icon}
                        {group.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          selectGroup(groupKeys, !allSelected)
                        }
                        className="text-[10px] text-gray-600 hover:text-gray-900 font-medium transition cursor-pointer"
                      >
                        {allSelected ? "解除" : "全選択"}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {group.items.map(({ key, label, desc }) => {
                        const isChecked = randomTargets[key];

                        return (
                          <label
                            key={key}
                            className={`flex items-start gap-2.5 p-2 rounded border transition cursor-pointer select-none ${
                              isChecked
                                ? "bg-white/90 border-gray-400 text-gray-900 shadow-inner ring-1 ring-gray-400/20"
                                : "bg-white/60 border-gray-200/70 text-gray-600 hover:bg-white/80"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTarget(key)}
                              className="sr-only"
                            />
                            <div
                              className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked
                                  ? "bg-gray-900 border-gray-900 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <CheckSquareIcon className="w-2.5 h-2.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[11px]">
                                {label}
                              </div>
                              <div className="text-[9.5px] text-gray-500 leading-tight">
                                {desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-gray-900/90 hover:bg-gray-900 text-white px-4 py-1.5 rounded font-medium text-xs transition cursor-pointer shadow-xs"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
