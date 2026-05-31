// 统一的HTTP请求封装，使用fetch替代axios

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

class RequestService {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  private async request<T = any>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout
    } = options;

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // 设置默认headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 构建fetch配置
    const fetchOptions: RequestInit = {
      method,
      headers: defaultHeaders,
    };

    // 添加请求体（GET请求不需要body）
    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时');
        }
        throw error;
      }
      throw new Error('请求失败');
    }
  }

  // GET请求
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  // POST请求
  async post<T = any>(
    url: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body: data, headers });
  }

  // PUT请求
  async put<T = any>(
    url: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body: data, headers });
  }

  // DELETE请求
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  // PATCH请求
  async patch<T = any>(
    url: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body: data, headers });
  }
}

// 创建默认的请求实例
export const request = new RequestService();

// 导出RequestService类，允许创建自定义实例
export { RequestService };

// 导出类型定义
export type { RequestOptions, ApiResponse };