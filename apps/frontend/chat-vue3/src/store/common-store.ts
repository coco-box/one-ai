import { defineStore } from "pinia";
import { ref } from "vue";

interface FlowItem {
  workflow_id: string;
  app_name: string;
  workflow_name: string;
  isActive?: boolean;
}

export const useCommonStore = defineStore("common", () => {
  const isExpand = ref(true);
  const sessionId = ref<string>("");
  const activeFlow = ref<FlowItem | null>(null);

  const setSessionId = (id: string) => {
    sessionId.value = id;
  };

  const getSessionId = () => {
    return sessionId.value;
  };

  const setActiveFlow = (flow: FlowItem | null) => {
    activeFlow.value = flow;
  };

  const getActiveFlow = () => {
    return activeFlow.value;
  };

  return { isExpand, sessionId, activeFlow, setSessionId, getSessionId, setActiveFlow, getActiveFlow };
});
