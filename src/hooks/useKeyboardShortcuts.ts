import { useEffect } from "react";

interface KeyboardShortcutsOptions {
  onRandomizeAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTogglePanel?: () => void;
  onStartRecord?: () => void;
  onStopRecord?: () => void;
  onToggleDebug?: () => void;
  onExportImage?: () => void;
}

export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions,
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT"
      ) {
        return;
      }

      // Space: Randomize
      if (e.code === "Space") {
        e.preventDefault();
        options.onRandomizeAll?.();
        return;
      }

      // H: Toggle Panel
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        options.onTogglePanel?.();
        return;
      }

      // R: Start Recording
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        options.onStartRecord?.();
        return;
      }

      // S: Stop Recording
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        options.onStopRecord?.();
        return;
      }

      // D: Toggle Debug Mode
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        options.onToggleDebug?.();
        return;
      }

      // P: Export High-Res PNG
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        options.onExportImage?.();
        return;
      }

      // Ctrl + Z: Undo
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        options.onUndo?.();
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z: Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" ||
          (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        options.onRedo?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [options]);
}
