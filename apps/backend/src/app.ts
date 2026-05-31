import express, { Application, json } from 'express';
import chatRoutes from './modules/chat/chat.route';
import settingRoutes from './modules/setting/setting.route';
import cors from 'cors';
import { ChatController } from './modules/chat/chat.controller';

const app: Application = express();
const chatController = new ChatController();

app.use(json());
app.use(cors());

app.use('/api/ai_agent/chat', chatRoutes);
app.use('/api/ai_agent/setting', settingRoutes);
app.use('/api/ai_agent/session/start', chatController.streamMockChat);

export default app; 