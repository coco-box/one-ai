import axios from 'axios';

/**
 * 请求配置接口
 */
interface RequestConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

/**
 * 创建axios实例，统一配置
 * http://10.1.120.15:30080/
 */
const defaultConfig: RequestConfig = {
  baseURL: import.meta.env.VUE_APP_BASE_API || '/',
  timeout: 10000,
};

const service = axios.create(defaultConfig);

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config) => {
    // 从Vuex获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      // 如果配置中没有headers，则创建一个
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
    // eslint-disable-next-line comma-dangle
  }
);

/**
 * 响应拦截器
 */
service.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 可以根据业务需求统一处理响应
    if (response.status !== 200) {
      console.error('请求异常:', res.message || '未知错误');
      return Promise.reject(new Error(res.message || '未知错误'));
    }
    if (res.code === 200) res.success = 200;
    return res;
  },
  (error) => {
    console.error('请求失败:', error.message);

    // 统一处理错误，例如401未授权、500服务器错误等
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('未授权，请重新登录');
          // 可以触发登出操作
          localStorage.removeItem('token');
          break;
        case 403:
          console.error('拒绝访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error(`请求失败: ${error.response.status}`);
      }
    }

    return Promise.reject(error);
    // eslint-disable-next-line comma-dangle
  }
);

export default service;
