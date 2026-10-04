import { useEffect } from "react";

/**
 * step値から有効な小数点桁数を取得する関数
 */
function getStepPrecision(step: number): number {
  const stepStr = step.toString();
  const decimalIndex = stepStr.indexOf(".");
  return decimalIndex >= 0 ? stepStr.length - decimalIndex - 1 : 0;
}

/**
 * React の内部 valueTracker をバイパスし、Controlled input の onChange を確実にトリガーする関数
 */
function setNativeInputValue(
  element: HTMLInputElement,
  value: string,
): void {
  const valueSetter = Object.getOwnPropertyDescriptor(
    element,
    "value",
  )?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value",
  )?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * range input 要素の上でマウスホイールを回転させた際に
 * スライダーの値を増減させ、React の onChange を確実に発火させるフック
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
        const precision = getStepPrecision(step);
        const rawNext = current + step * direction;
        const clampedNext = Math.max(min, Math.min(max, rawNext));
        const formattedNext =
          precision > 0
            ? clampedNext.toFixed(precision)
            : String(Math.round(clampedNext));

        setNativeInputValue(input, formattedNext);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);
}
