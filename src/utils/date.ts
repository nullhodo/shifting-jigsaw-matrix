/**
 * CCYY_MMDD_hhmmss 形式の日時文字列を返すユーティリティ
 */
export function getFormattedDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}_${m}${d}_${h}${min}${s}`;
}
