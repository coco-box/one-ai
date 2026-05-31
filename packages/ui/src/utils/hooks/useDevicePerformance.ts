import { ref, Ref } from '@vue/composition-api';

/**
 * 设备性能等级
 */
export type DevicePerformanceLevel = 'high' | 'medium' | 'low';

/**
 * 设备性能配置
 */
export interface DevicePerformanceConfig {
  level: DevicePerformanceLevel;
  idleTimeout: number;   // 空闲时的 timeout
  busyTimeout: number;   // 繁忙时的 timeout
}

/**
 * 估算设备内存 (基于 CPU 核心数)
 */
function estimateDeviceMemory(): number {
  const cores = navigator.hardwareConcurrency || 2;
  if (cores >= 8) return 8;
  if (cores >= 4) return 4;
  if (cores >= 2) return 2;
  if (cores >= 1) return 1;
  return 4;
}

/**
 * 检测设备性能等级
 */
function detectDevicePerformance(): DevicePerformanceConfig {
  const cores = navigator.hardwareConcurrency || 2;
  let memory = (navigator as any).deviceMemory;

  // HTTP 环境下 deviceMemory 不可用，使用替代方案
  if (memory === undefined) {
    memory = estimateDeviceMemory();
  }

  // 高端设备: 8核8GB+
  if (cores >= 8 && memory >= 8) {
    return {
      level: 'high',
      idleTimeout: 16,   // 空闲时 16ms (60fps)
      busyTimeout: 50,   // 繁忙时 50ms
    };
  }

  // 中端设备: 4核4GB+
  if (cores >= 4 && memory >= 4) {
    return {
      level: 'medium',
      idleTimeout: 50,    // 空闲时 50ms
      busyTimeout: 300,   // 繁忙时 300ms
    };
  }

  // 低端设备: 其他
  return {
    level: 'low',
    idleTimeout: 100,   // 空闲时 100ms
    busyTimeout: 500,   // 繁忙时 500ms
  };
}

// 全局单例状态
let globalDevicePerf: DevicePerformanceConfig | null = null;

/**
 * 使用设备性能检测 (单例模式)
 * 
 * 只在第一次调用时检测设备性能，后续调用直接返回缓存结果
 * 
 * @example
 * ```ts
 * const devicePerf = useDevicePerformance();
 * const timeout = isBusy ? devicePerf.busyTimeout : devicePerf.idleTimeout;
 * ```
 */
export function useDevicePerformance(): Ref<DevicePerformanceConfig> {
  if (!globalDevicePerf) {
    globalDevicePerf = detectDevicePerformance();
  }

  return ref(globalDevicePerf);
}
