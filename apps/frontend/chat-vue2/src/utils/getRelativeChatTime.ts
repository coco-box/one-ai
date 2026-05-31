import { normalizeToSeconds } from './normalizeToSeconds';

/**
 * 获取历史消息相对时间或完整时间
 */
export function getRelativeChatTime({
  messageTimestamp,
  serverNow,
  relativeThresholdDays = 7,
  fullFormat = 'YYYY-MM-DD HH:mm',
}: {
  messageTimestamp: number | string | Date;
  serverNow: number | string | Date;
  relativeThresholdDays?: number;
  fullFormat?: string;
}): string {
  const tsSec = normalizeToSeconds(messageTimestamp);
  const serverNowSec = normalizeToSeconds(serverNow);
  const localNowSec = normalizeToSeconds(Date.now());

  if (!tsSec || !serverNowSec || !localNowSec) return '';

  // 秒级偏移量
  const offsetSec = serverNowSec - localNowSec;

  // 修正后的消息时间
  const correctedDate = new Date((tsSec - offsetSec) * 1000);

  // 计算相对天数
  const diffDays = (Date.now() / 1000 - correctedDate.getTime() / 1000) / (60 * 60 * 24);

  // 超过阈值，显示完整日期
  if (diffDays > relativeThresholdDays) {
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const Y = correctedDate.getFullYear();
    const M = pad(correctedDate.getMonth() + 1);
    const D = pad(correctedDate.getDate());
    const h = pad(correctedDate.getHours());
    const m = pad(correctedDate.getMinutes());
    const s = pad(correctedDate.getSeconds());
    return fullFormat
      .replace('YYYY', String(Y))
      .replace('MM', String(M))
      .replace('DD', String(D))
      .replace('HH', String(h))
      .replace('mm', String(m))
      .replace('ss', String(s));
  }

  // 否则显示相对时间
  const diffSec = Date.now() / 1000 - correctedDate.getTime() / 1000;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
}