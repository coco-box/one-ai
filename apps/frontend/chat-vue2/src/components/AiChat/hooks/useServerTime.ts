import { ref, computed, Ref } from '@vue/composition-api';
import { normalizeToSeconds } from '@/utils';

export function useServerTime(initialServerTimeSec: Ref<number>) {
  // 本地当前时间对应的服务器时间偏移（秒）
  const offset = ref(initialServerTimeSec.value - normalizeToSeconds(Date.now())!);

  // 获取当前服务器时间（秒级）
  const getServerNow = () => normalizeToSeconds(Date.now())! + offset.value;

  // 每次调用都会返回实时的服务器时间
  const serverNow = computed(() => getServerNow());

  // 如果后端在未来某个时刻提供了最新服务器时间，可以更新偏移
  const updateServerTime = (newServerTimeSec: number) => {
    offset.value = newServerTimeSec - normalizeToSeconds(Date.now())!;
  };

  return {
    getServerNow,
    serverNow,
    updateServerTime,
  };
}
