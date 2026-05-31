import app from './app';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { ChatService } from './modules/chat/chat.service';

const PORT = process.env.PORT || 3007;

// 创建HTTP服务器
const server = createServer(app);

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ noServer: true });
const chatService = new ChatService();

// 处理 HTTP 服务器的升级请求
server.on('upgrade', (request, socket, head) => {
  // 根据请求路径判断是否是我们的 WebSocket 聊天接口
  if (request.url?.startsWith('/api/chat/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      // 提取 sessionId
      const sessionId = request.url?.split('/')[4] || '';
      // 处理 WebSocket 连接
      chatService.handleWebSocketConnection(ws, sessionId);
    });
  } else {
    socket.destroy();
  }
});

// 启动HTTP服务器
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is available at ws://localhost:${PORT}/chat/ws`);
});