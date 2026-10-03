import { useAtom } from "jotai";
import {
  DownloadIcon,
  FileCodeIcon,
  ImageIcon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { recordingStateAtom } from "../../state/jigsawStore";

interface Props {
  onExportPng: () => void;
  onExportSvg: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExportSection: React.FC<Props> = ({
  onExportPng,
  onExportSvg,
  onStartRecord,
  onStopRecord,
  onExportJson,
  onImportJson,
}) => {
  const [recState] = useAtom(recordingStateAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between text-slate-200 font-semibold border-b border-slate-700/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-sky-400">
          <DownloadIcon className="w-3.5 h-3.5" />
          <span>Export & Storage</span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono">
          Hi-Res & MP4
        </span>
      </div>

      {/* Hi-Res PNG */}
      <button
        type="button"
        onClick={onExportPng}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-950/50 transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
      >
        <ImageIcon className="w-4 h-4" />
        <span>Export Hi-Res Image (2880px) + JSON (P)</span>
      </button>

      {/* Vector SVG */}
      <button
        type="button"
        onClick={onExportSvg}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
      >
        <FileCodeIcon className="w-3.5 h-3.5 text-sky-400" />
        <span>Export Vector SVG Graphics</span>
      </button>

      {/* 60fps MP4 Video Recording */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={recState.isRecording}
            onClick={onStartRecord}
            className={`py-1.5 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1.5 ${
              recState.isRecording
                ? "bg-slate-800 opacity-50 cursor-not-allowed text-slate-500"
                : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-98"
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Rec 60fps</span>
            <span className="kbd-key text-[10px]">R</span>
          </button>

          <button
            type="button"
            disabled={!recState.isRecording}
            onClick={onStopRecord}
            className={`py-1.5 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1.5 ${
              !recState.isRecording
                ? "bg-slate-800 opacity-50 cursor-not-allowed text-slate-500"
                : "bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-600 cursor-pointer active:scale-98"
            }`}
          >
            <span>Stop & Save</span>
            <span className="kbd-key text-[10px]">S</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          H.264 / mp4-muxer による 60fps 高画質 MP4 を直接生成
        </p>
      </div>

      {/* JSON Backup & Restore */}
      <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400 font-medium block">
          Preset JSON Backup & Restore:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExportJson}
            className="py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98"
          >
            <UploadIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Load JSON</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onImportJson}
          className="hidden"
        />
      </div>
    </section>
  );
};
