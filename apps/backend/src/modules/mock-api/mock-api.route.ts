import { Router, Response } from 'express';
import { ChatController } from '../chat/chat.controller';

type MockSessionStatus = 0 | 1 | 2;

interface MockSession {
  app_name: string;
  workflow_name: string;
  session_id: string;
  flow_id: string;
  status: MockSessionStatus;
  create_time: string;
  update_time: string;
}

const flows = [
  {
    workflow_id: 'items_flow_000000000000000000000',
    app_name: '权限应用',
    workflow_name: '事项影响评估',
    running_count: 1,
  },
  {
    workflow_id: 'mock_flow_000000000000000000001',
    app_name: 'Mock 应用',
    workflow_name: '通用对话流程',
    running_count: 0,
  },
];

const now = new Date().toISOString();
const sessions: MockSession[] = [
  {
    app_name: flows[0].app_name,
    workflow_name: flows[0].workflow_name,
    session_id: '3c7ca3e7dfe84a82a8dec0d5297d0f7a',
    flow_id: flows[0].workflow_id,
    status: 0,
    create_time: now,
    update_time: now,
  },
];

function sendOk<T>(res: Response, data: T, message = 'success', extra: Record<string, unknown> = {}) {
  res.status(200).json({
    code: 200,
    msg: message,
    message,
    data,
    timestamp: Date.now(),
    ...extra,
  });
}

function createSessionId() {
  return `mock-session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function findFlow(flowId?: string) {
  return flows.find((flow) => flow.workflow_id === flowId) || flows[0];
}

function upsertSession(sessionId: string, flowId?: string, status: MockSessionStatus = 0) {
  const existing = sessions.find((session) => session.session_id === sessionId);
  const flow = findFlow(flowId || existing?.flow_id);
  const updateTime = new Date().toISOString();

  if (existing) {
    existing.status = status;
    existing.update_time = updateTime;
    return existing;
  }

  const session: MockSession = {
    app_name: flow.app_name,
    workflow_name: flow.workflow_name,
    session_id: sessionId,
    flow_id: flow.workflow_id,
    status,
    create_time: updateTime,
    update_time: updateTime,
  };
  sessions.unshift(session);
  return session;
}

export function createMockApiRoutes(chatController: ChatController) {
  const router = Router();

  router.get('/flow/list', (_req, res) => {
    sendOk(res, flows);
  });

  router.get('/session/list', (req, res) => {
    const flowId = req.query.flow_id as string | undefined;
    const data = flowId ? sessions.filter((session) => session.flow_id === flowId) : sessions;
    sendOk(res, data, 'success', { count: data.length });
  });

  router.get('/history_session/:sessionId', (req, res) => {
    const session = upsertSession(req.params.sessionId);
    sendOk(res, {
      messages: [],
      session_info: session,
    });
  });

  router.post('/create_session', (req, res) => {
    const session = upsertSession(createSessionId(), req.body?.flow_id);
    sendOk(res, { session_id: session.session_id });
  });

  router.post('/session/create', (req, res) => {
    const session = upsertSession(createSessionId(), req.body?.flow_id);
    sendOk(res, { session_id: session.session_id });
  });

  router.post('/end_session/:sessionId', (req, res) => {
    const session = upsertSession(req.params.sessionId, undefined, 2);
    sendOk(res, {
      session_id: session.session_id,
      user_id: req.body?.user_id || 'admin',
      status: session.status,
    });
  });

  router.post('/pause_session/:sessionId', (req, res) => {
    const session = upsertSession(req.params.sessionId, undefined, 2);
    sendOk(res, {
      session_id: session.session_id,
      user_id: req.body?.user_id || 'admin',
      status: session.status,
    });
  });

  router.post('/resume_session/:sessionId', (req, res) => {
    const session = upsertSession(req.params.sessionId, undefined, 1);
    sendOk(res, {
      session_id: session.session_id,
      user_id: req.body?.user_id || 'admin',
      status: session.status,
    });
  });

  router.post('/session/start/:sessionId', chatController.streamMockChat.bind(chatController));

  return router;
}