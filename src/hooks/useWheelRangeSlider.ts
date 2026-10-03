import { useEffect } from "react";

/**
 * range input 要素の上でマウスホイールを回転させた際に
 * スライダーの値を増減させるアクセシビリティ向上フック
 */
export function useWheelRangeSlider(): void {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        target.tagName === "INPUT" &&
        (target as HTMLInputElement).type === "range"
      ) {
        e.preventDefault();
        const input = target as HTMLInputElement;
        const step = Number.parseFloat(input.step) || 1;
        const min = Number.parseFloat(input.min) || 0;
        const max = Number.parseFloat(input.max) || 100;
        const current = Number.parseFloat(input.value) || 0;

        const direction = e.deltaY < 0 ? 1 : -1;
        const next = Math.max(
          min,
          Math.min(max, current + step * direction),
        );

        input.value = String(next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);
}
