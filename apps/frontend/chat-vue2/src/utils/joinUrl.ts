/**
 * 拼接 url
 * @param parts 需要拼接的 url 片段
 * @returns 拼接后的 url
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .filter(Boolean) // 去掉空字符串或 null、undefined
    .map((part, index) => {
      if (index === 0) {
        // 第一个参数保留结尾的 `/`，去掉结尾多余 `/`
        return part.replace(/\/+$/, '');
      }
      // 其他参数去除开头和结尾的 `/`
      return part.replace(/^\/+|\/+$/g, '');
    })
    .join('/');
}