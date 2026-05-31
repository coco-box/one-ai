# @coco-box/ai-vue-2

Vue2.6+ 和 Composition API 版本的 `@coco-box/ai` 抽象类实现。使用方式可参考：<https://ai-sdk.dev/docs/getting-started/nuxt#wire-up-the-ui>

## 安装

```bash
npm install @coco-box/ai @coco-box/ai-ag-ui-adapter @coco-box/ai-vue-2
```

## 使用

### 非 ag-ui 协议用法

```ts
import { Chat } from '@coco-box/ai-vue-2';

const chat = new Chat({});
```

### ag-ui 协议用法

```ts
import { Chat } from '@coco-box/ai-vue-2';
import { AgUiHttpTransport } from "@coco-box/ai-ag-ui-adapter";

const chat = new Chat({
  transport: new AgUiHttpTransport({
    api: '',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-token',
    },
    prepareSendMessagesRequest: (({ messages, trigger, body }) => {
      const api = 'api/start';
      switch (trigger) {
        case 'submit-message': {
          const lastMessage = messages[messages.length - 1];

          // 只向服务器发送最后一条消息以限制请求大小:
          return {
            body: {
              ...body,
              user_id: aiConfig.userInfo.id,
              query: lastMessage.parts[0]?.text,
              inputs: {},
            },
            api,
          };
        }
        default:
          return { body: {}, api };
      }
    }),
    onUpdate: () => {
      tryAutoScroll(false, 'auto');
    },
  }),
  onFinish: async ({ messages }) => {
    console.log('onFinish', messages);
  }
});
```
