/**
 * 将 SVG 字符串转换为 Base64 格式的 Data URL
 * @param svg SVG 字符串
 * @returns Base64 格式的 Data URL
 */
export const svgToBase64 = (svg: string) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(svg);
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | (bytes[i + 2] || 0);

    for (let j = 0; j < 4; j++) {
      if (i * 8 + j * 6 <= bytes.length * 8) {
        result += base64Chars[(chunk >> (6 * (3 - j))) & 0x3F];
      } else {
        result += '=';
      }
    }
  }

  return `data:image/svg+xml;base64,${result}`;
};