import type { IMessage } from "@/types";
import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useChatHistoryStore } from "./history-store";
import { useChatModelStore } from "./model-store";
import { useChatStatusStore } from "./status-store";
import { createSessionNew } from "@/api/homePageApi";

import { Chat } from "@coco-box/ai-vue";
import { AgUiHttpTransport } from "@coco-box/ai-ag-ui-adapter";

const baseUrl = '/api';

export const useChatMessageStore = defineStore("chat-message", () => {
  const route = useRoute();
  const chatStatusStore = useChatStatusStore();
  const chatHistoryStore = useChatHistoryStore();
  const chatModelStore = useChatModelStore();

  // 状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // 从路由参数中获取session_id
  // const session_id = computed(() => route.query.session_id as string);
  const session_id = ref('');
  console.log('start_session-session_id', session_id.value);
  const getSession = async () => {
    const sessionId = await createSessionNew({
      user_id: 'admin',
      business_id: '935b1aa2f81fdffd83ac320034d342a1',
      flow_id: 'items_flow_000000000000000000000',
      app_id: "permission_application_items_000",
    });
    return sessionId;
  }

  onMounted(async () => {
    const sessionId = await getSession();
    if (sessionId) {
      session_id.value = sessionId;
    }
  });
  const chat = new Chat({
    transport: new AgUiHttpTransport({
      // api: `${baseUrl}/start_session/${session_id.value}`, // 线上的
      // api: `http://localhost:3007/api/start_session/${session_id.value}`, // mock 的
      // api: `${baseUrl}/start_session/3c7ca3e7dfe84a82a8dec0d5297d0f7a`, // items 临时的
      api: `${baseUrl}/session/start/3c7ca3e7dfe84a82a8dec0d5297d0f7a`, // 新基座的
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer mock-token`,
      },
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        const api = `${baseUrl}/session/start/${session_id.value}`;
        switch (trigger) {
          case "regenerate-message":
            // 省略消息数据传输，仅发送messageId:
            return {
              body: {
                trigger: "regenerate-message",
                id,
                messageId,
              },
              api,
            };

          case "submit-message":
            const lastMessage = messages[messages.length - 1];
            console.log('submit-message');
            // 只向服务器发送最后一条消息以限制请求大小:
            return {
              body: {
                // user_id:"admin",
                // // @ts-expect-error
                // query: lastMessage.parts[0]?.text
                "user_id": "admin",
                "query": "请开始影响评估",
                inputs: {
                  "emergency_event_id":"935b1aa2f81fdffd83ac320034d342a1",
                  "system_id":"194ad2783dc64fa28fddf3e34f043fb4",
                  "token":"Bearer eyJhbGciOiJSUzUxMiJ9.eyJ0ZW5hbnRJZCI6IjFmMDg2MzE5MmVlZmY3MzM5ZTA2MDA3YmIyOWZhY2ZhIiwic291cmNlIjowLCJleHAiOjE3NTg4MDY5NjQsImlzVGVuYW50Q3JlYXRvciI6MSwidXNlcklkIjoiZmVmYzViNDgwZDYwODI3MDBkOGI3ZTk0NDEzNGVlMWEiLCJ1c2VybmFtZSI6Iml0ZW1zNDAwIn0.gt0QxcK5IanpNVjipGfxllGgu51mpcVkSGyOXYVT_VPLgekz6uMLn3W9uGhPbOwLodMHIvPBp2o1QVZ9mWLDsnr1n1ExS9RW7lJM1DgOTWhAZZIsz7PRSQKoqAD0HzQPGMlvIbMp_Pg87inIJyenAdg6apyxivwvSVcaYYRb9eUFj23DYozIOfX6Zr2CR6nGwcBSwULyL9nqxrZ6dD9rSU7p7re11Pvuewgn-Tn5fbz3QKiVoBg6HyNF3e2F-UFXZJppa0eqjd3MuiLqAAXC9KXQNp2VliX6cOXaINisdgsaJSXcJE7Odp412Ji7j33l9yPRoqyP5ZxrqWjVkb5k1g"
                },
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
  const messageChangeCount = ref(0);

  async function ask(question: string) {
    if (!question.trim() || isLoading.value) return;

    error.value = null;
    isLoading.value = true;

    if (!messages.value.length) {
      chatStatusStore.startChat = true;
      chatStatusStore.newChatId();
    }

    chatHistoryStore.addHistory(
      chatStatusStore.currentChatId,
      dayjs().format("YYYY-MM-DD HH:mm"),
      messages.value,
      chatModelStore.currentModel
    );

    // messages.value.push({
    //   from: "user",
    //   content: question,
    //   avatarPosition: "side-right",
    //   avatarConfig: { ...customerAvatar },
    // });
    // messageChangeCount.value++;
    // getAIAnswer(answer ?? question);

    try {
      // 发送消息
      await chat.sendMessage({
        text: question,
        // metadata: {
        //   avatarConfig: customerAvatar,
        // },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        error.value = err.message || "发送消息失败";
      }
      isLoading.value = false;
    }
  }

  function cancel() {
    isLoading.value = false;
    chat.stop();
  }

  // 设置消息列表
  function setMessages(newMessages: IMessage[]) {
    chat.messages = [...newMessages];
  }

  return { messages, messageChangeCount, ask, setMessages, cancel, isLoading, getSession };
});
