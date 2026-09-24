# @coco-box/ai-ag-ui-adapter

## 0.0.4

### Patch Changes

- fix: 按 SSE 标准解析 `id`、`event`、`retry`、注释、多行 `data` 与任意网络分片，同时兼容旧 SSE、JSONL 和对象事件流
- feat: 新增 `transformChunk`，支持在消息状态机消费前替换或丢弃业务 chunk

## 0.0.3

### Patch Changes

- fix: 抛出具体解析错误

## 0.0.2

### Patch Changes

- fix: 修复 agui 事件抛错风暴

## 0.0.1

### Patch Changes

- 初始化
- Updated dependencies
  - @coco-box/ai@0.0.1
