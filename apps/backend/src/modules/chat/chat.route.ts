import { Router, Request } from 'express';
import { ChatController } from './chat.controller';

const router = Router();
const chatController = new ChatController();

// 基础路由
router.get('/', chatController.getChat);
router.post('/', chatController.createChat);

// 原有的 SSE 接口（保持兼容性）
router.post('/awp', chatController.streamChat);
router.post('/sse', chatController.streamMockChat);

// 新的基于 AbstractAgent 的接口
router.post('/agent', chatController.agentChat);

export default router;