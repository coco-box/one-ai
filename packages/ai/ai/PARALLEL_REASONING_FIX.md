# 并行思考（Parallel Reasoning）Bug 修复说明

## 问题描述

当后端推送并行的 AG-UI 思考事件时（例如智能体A 和智能体B 同时思考，交替推送各自的 `THINKING_TEXT_MESSAGE_*` 事件），前端解析报错：

```
TypeError: Cannot read properties of undefined (reading 'text')
    at applyUIMessageChunk (process-ui-message-stream.ts)
```

以及级联错误：

```
TypeError: Failed to execute 'enqueue' on 'ReadableStreamDefaultController':
Cannot enqueue a chunk into a closed readable stream
```

### 典型事件流

```
THINKING_TEXT_MESSAGE_START  (智能体A)
THINKING_TEXT_MESSAGE_START  (智能体B)
THINKING_TEXT_MESSAGE_CONTENT delta="好的，我"  (智能体B)
THINKING_TEXT_MESSAGE_CONTENT delta="好的，"    (智能体A)
...交替推送...
THINKING_TEXT_MESSAGE_END    (智能体A)
THINKING_TEXT_MESSAGE_END    (智能体B)
```

注意：这些事件 **没有 `messageId`**，前端需要根据 `rawEvent.name`（即智能体名称）来区分不同的思考流。

---

## 根因分析

### 1. `currentReasoningId` 是单一值，不支持并行

原始实现中 `state.currentReasoningId` 是一个 `string`，只记录**最后一个**开始的 reasoning 的 id。当两个智能体并行思考时：

- 智能体A 开始 → `currentReasoningId = "ra-123"`
- 智能体B 开始 → `currentReasoningId = "rb-456"` ← **覆盖了 A 的 id！**

### 2. `reasoning-delta/end` 使用错误的 id 查找 reasoning part

后续智能体A 的 `THINKING_TEXT_MESSAGE_CONTENT` 到达时，由于 `chunk.id` 为 `undefined`（无 messageId），回退到 `state.currentReasoningId` 获取到的是智能体B 的 reasoning id，导致：

- A 的思考内容被写入 B 的 reasoning part（数据污染）
- A 的 `THINKING_TEXT_MESSAGE_END` 删除了 B 的 reasoning part
- 随后 B 的内容到达时 `activeReasoningParts[id]` 为 `undefined` → **`undefined.text` 崩溃！**

### 3. `shouldStartNewMessage` 在 reasoning 续传时创建多余空消息

每当 agent 名称切换，`shouldStartNewMessage` 返回 `true`，为 `reasoning-delta` 创建全新的空消息（而不是复用已有消息），进一步加剧了路由混乱。

### 4. stream-adapter 级联报错

`process-ui-message-stream.ts` 崩溃后 TransformStream 报错，导致上游 ReadableStream 被 cancel，后续 `controller.enqueue()` 抛出 "closed readable stream" 错误。

---

## 修复方案

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/ui/default-should-start-new-message.ts` | 默认消息切分逻辑修复 |
| `src/ui/process-ui-message-stream.ts` | 并行 reasoning 路由修复 |
| `src/ui/index.ts` | 导出 `defaultShouldStartNewMessage` |
| `adapters/ag-ui/src/stream-adapter.ts` | 防御性修复 |
| `chat-runtime-vue2/.../message-mapping.ts` | 同步导入 & state 初始化 |

### 设计思路

保持 `shouldStartNewMessage` 作为**外部回调**的灵活性——`applyUIMessageChunk` 中始终调用它，不做白名单过滤。由 **回调自身** 根据 `newChunkData.type` 判断是否需要新消息。这样开发者可以在 `new Chat({ shouldStartNewMessage })` 中传入自定义逻辑完全控制消息切分行为。

### 1. 修复 `defaultShouldStartNewMessage`（核心）

```typescript
// 不会创建新 part 的续传类事件——直接返回 false，不创建新消息
const CONTINUATION_EVENT_TYPES = new Set([
  'text-delta', 'text-end',
  'reasoning-delta', 'reasoning-end',
  'tool-input-delta', 'tool-input-available',
  'tool-output-available', 'tool-output-error',
  'finish-step', 'start', 'finish',
  'message-metadata', 'error', 'reasoning',
]);

export function defaultShouldStartNewMessage(currentMessage, newChunkData) {
  // 续传事件不创建新消息
  if (CONTINUATION_EVENT_TYPES.has(newChunkData.type)) return false;
  // 当前消息无 agent 名称时，复用当前消息
  if (!currentMessage.metadata?.name) return false;
  // agent 名称不同时，开启新消息
  return !!(newChunkData.rawData?.rawEvent?.name
    && newChunkData.rawData.rawEvent.name !== currentMessage.metadata?.name);
}
```

**为什么这样设计？**
- 续传事件（delta/end/output 等）只通过引用修改已有 part，不往消息的 `parts` 数组 push 新元素
- 如果这些事件也触发 `shouldStartNewMessage`，在并发场景下智能体名称交替切换会创建大量空消息

**开发者自定义示例**：如果开发者不需要按智能体拆分消息，可以传入：
```typescript
new Chat({
  shouldStartNewMessage: () => false, // 所有内容合并到一条消息
})
```

### 2. `currentReasoningId` → `currentReasoningIds`（按智能体名称跟踪）

```typescript
// 修改前
currentReasoningId?: string;

// 修改后
currentReasoningIds: Record<string, string>; // agent name → reasoning id
```

将单一 reasoning id 改为以 **agent name 为 key** 的 `Record`，支持多个智能体同时维护各自独立的 reasoning id。

### 3. reasoning 处理器按 agent name 路由

```typescript
// reasoning-start: 按 agent name 存储 reasoning id
const agentName = chunk.rawData?.rawEvent?.name ?? chunk.rawData?.name ?? '__default__';
state.currentReasoningIds[agentName] = chunk.id;

// reasoning-delta: 按 agent name 查找 reasoning id
chunk.id = chunk.id ?? state.currentReasoningIds[agentName];

// reasoning-end: 按 agent name 查找并清理
chunk.id = chunk.id ?? state.currentReasoningIds[agentName];
delete state.currentReasoningIds[agentName];
```

每个智能体的 reasoning 流通过 `rawEvent.name` 独立路由，互不干扰。

### 4. 防御性空值检查

```typescript
const reasoningPart = state.activeReasoningParts[chunk.id];
if (!reasoningPart) break; // 防御：并行场景下若 part 未找到则跳过
```

### 5. 还原 `applyUIMessageChunk` 消息路由

```typescript
// 修改后（还原为始终调用 shouldStartNewMessage）
if (shouldStartNewMessage(state.message, chunk)) {
  state.message = createUIMessage({ ... }) as UI_MESSAGE;
  state.messages.push(state.message);
}
```

不再在 `applyUIMessageChunk` 中做白名单过滤，而是交给 `shouldStartNewMessage` 回调自行决策。

### 6. 防御性修复 (stream-adapter.ts)

在 `emitEventObject` 中增加 `isClosed` 前置检查：

```typescript
if (isClosed) return; // 流已关闭时不再 enqueue
```

### 7. 导出 `defaultShouldStartNewMessage`

从 `src/ui/index.ts` 导出，方便外部使用（如历史消息转换）：
```typescript
export { defaultShouldStartNewMessage } from './default-should-start-new-message';
```

---

## 兼容性

- **单智能体场景**：当 `rawEvent.name` 不存在时，使用 `'__default__'` 作为 fallback key，行为与修复前完全一致。
- **带 messageId 的场景**：如果 `chunk.id` 已经由后端提供（非 `undefined`），则直接使用，不走 `currentReasoningIds` 查找逻辑，与原始 ai-sdk 行为兼容。
- **历史回放**（`runUpdateMessageJob` 导出函数）：使用相同的 `applyUIMessageChunk` 逻辑，state 初始化已更新为 `currentReasoningIds: {}`。

---

## 修复后预期行为

对于并行思考事件流：

```
THINKING_START(A) → 消息1 创建，reasoning-A 添加到消息1
THINKING_START(B) → 消息2 创建，reasoning-B 添加到消息2
THINKING_CONTENT(B) → 通过 currentReasoningIds['智能体B'] 找到 reasoning-B，追加内容 ✓
THINKING_CONTENT(A) → 通过 currentReasoningIds['智能体A'] 找到 reasoning-A，追加内容 ✓
THINKING_END(A)    → 结束 reasoning-A，清理 currentReasoningIds['智能体A'] ✓
THINKING_END(B)    → 结束 reasoning-B，清理 currentReasoningIds['智能体B'] ✓
```

每个智能体的思考内容被正确追加到各自的 reasoning part 中，不再互相干扰。
