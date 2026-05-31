# @coco-box/ai-vue

Vue3 版本的 `@coco-box/ai` 抽象类实现。使用方式可参考：<https://ai-sdk.dev/docs/getting-started/nuxt#wire-up-the-ui>

## 安装

```bash
npm install @coco-box/ai @coco-box/ai-ag-ui-adapter @coco-box/ai-vue
```

## 使用

### 非 ag-ui 协议用法

```html
<script setup lang="ts">
import { Chat } from "@coco-box/ai-vue";
import { ref } from "vue";

const input = ref("");
const chat = new Chat({});

const handleSubmit = (e: Event) => {
    e.preventDefault();
    chat.sendMessage({ text: input.value });
    input.value = "";
};
</script>

<template>
    <div>
        <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">
            {{ m.role === "user" ? "User: " : "AI: " }}
            <div
                v-for="(part, index) in m.parts"
                :key="`${m.id}-${part.type}-${index}`"
            >
                <div v-if="part.type === 'text'">{{ part.text }}</div>
            </div>
        </div>

        <form @submit="handleSubmit">
            <input v-model="input" placeholder="Say something..." />
        </form>
    </div>
</template>
```

### ag-ui 协议用法

```ts
import { Chat } from "@coco-box/ai-vue";
import { AgUiHttpTransport } from "@coco-box/ai-ag-ui-adapter";

const chat = new Chat({
    transport: new AgUiHttpTransport({
      api: "api/start",
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        const api = `${your_base_url}/session/start/${your_session_id}`;
        switch (trigger) {
          case "submit-message":
            const lastMessage = messages[messages.length - 1];
            return {
              body: {
                "user_id": "admin",
                "query": "请开始影响评估",
                // ...
              },
              api,
            };
        }
      },
      onUpdate: (chunk) => {
        // e.g. 针对业务处理特殊逻辑, 譬如首次对话时, 从后端 RUN_STARTED 中获取 threadId(sessionId)
        console.log("onUpdate", chunk);
      },
    }),
    onData({ data, type }: { data: any, type: string }) {
      console.log("onData", data, type);
    },
    onFinish: ({ message }: { message: IMessage }) => {
      console.log("onFinish", message, messages, chat.messages);
      messageChangeCount.value++;
      isLoading.value = false;
    },
  });

  const messages = ref(chat.messages);
  watch(
    () => chat.messages,
    (val) => {
      messages.value = val;
    },
  )
```
