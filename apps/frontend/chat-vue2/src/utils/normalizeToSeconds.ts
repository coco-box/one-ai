/**
 * 将任意时间戳统一转换为秒级（10 位整数）
 * @param {number|string|Date|null|undefined} input
 * @returns {number | null} 秒级时间戳（10 位）
 */
export function normalizeToSeconds(input: number | string | Date | null | undefined) {
  if (!input) return null;

  // 如果是 Date 对象
  if (input instanceof Date) {
    return Math.floor(input.getTime() / 1000);
  }

  // 如果是字符串，尝试转为数字
  const num = Number(input);
  if (Number.isNaN(num)) return null;

  // 如果是毫秒级（13 位）
  if (num > 1e12) {
    return Math.floor(num / 1000);
  }

  // 如果已经是秒级
  return Math.floor(num);
}