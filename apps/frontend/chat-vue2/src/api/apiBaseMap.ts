const { protocol, hostname } = window.location;
const url = import.meta.env.DEV === 'development' ? 'http://10.1.120.15:32130/' : `${protocol}//${hostname}:32130/`;

// 从 URL 参数中获取 aiurl
const getAiUrlFromParams = () => {
  // 获取完整的 URL
  const fullUrl = window.location.href;
  // 使用正则表达式匹配 aiurl 参数
  const match = fullUrl.match(/[?&]aiurl=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
};

const apiBaseMap = {
  // chat: url,
  // chat: 'http://10.27.10.57:18001/', // 朗森
  // chat: 'http://10.1.120.15:32130/', // 高老师
  // note: 临时给后端的 feature, 连接本地 aiurl 调试
  // chat: process.env.VUE_APP_AI_IP ?? getAiUrlFromParams() ?? 'http://10.27.6.121:18001/' ?? url, // 121 线上
  chat: 'http://localhost:3000/api/',
  // chat: 'http://10.27.10.25:18001/', // 争维
  // chat: 'http://10.27.10.70:18001/', // 谢超
  // chat: 'http://172.16.17.211:18001/', // 谢超北京
  // chat: 'http://10.27.10.13:18001/', // 伟成
  // chaos: process.env.VUE_APP_CHAOS_URL,
};

export default apiBaseMap;
