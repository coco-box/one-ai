<template>
  <div class="home-page">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-icon">
        <img 
          src="../../assets/svg/logo.svg"
          style="width: 28px; height:28px;"
        ></img>
      </div>
      <h1 class="header-title">
        我的AI应用
      </h1>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 应用流程区域 -->
      <div class="app-flow-section">
        <div class="section-header">
          <div class="section-icon">
            <img src="../../assets/svg/app.svg"/>
          </div>
          <h2 class="section-title">应用流程</h2>
        </div>
        <div class="flow-cards">
          <div 
            v-for="flow in flowList" 
            :key="flow.id"
            class="flow-card"
            :class="{ active: flow.isActive }"
            @click="selectFlow(flow)"
          >
            <div class="card-content">
              <h3 :title="flow.app_name">{{ flow.app_name }}</h3>
              <div class="des-wrapper" :title="flow.workflow_name">
                <div class="des" :title="flow.workflow_name">
                  {{ flow.workflow_name }}
                </div>
                <svg v-if="flow.app_name !== '全部'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="32" height="32" viewBox="0 0 32 32">
                  <defs>
                    <clipPath id="master_svg0_707_038133">
                      <rect x="0" y="0" width="32" height="32" rx="0"/>
                    </clipPath>
                  </defs>
                  <g clip-path="url(#master_svg0_707_038133)">
                    <g>
                      <path d="M4,24.333333984558106L9.3333335,24.333333984558106L9.3333335,22.333333984558106L5,22.333333984558106L5,9.666666984558105L9.3333335,9.666666984558105L9.3333335,7.6666669845581055L4,7.6666669845581055Q3.9015086,7.666667044558105,3.80490969,7.685881794558106Q3.70831078,7.705096544558105,3.6173166,7.742787604558106Q3.52632242,7.780478594558105,3.44442987,7.835197444558106Q3.36253726,7.889916364558106,3.29289329,7.959560274558106Q3.22324938,8.029204244558105,3.16853052,8.111096794558106Q3.11381161,8.192989404558105,3.07612056,8.283983584558106Q3.0384295,8.374977764558105,3.0192148100000002,8.471576674558106Q3.00000006,8.568175584558105,3,8.666666984558105L3,23.333333984558106Q3.00000006,23.431824984558105,3.0192148100000002,23.528422984558105Q3.03842956,23.625021984558103,3.07612062,23.716015984558105Q3.11381161,23.807009984558107,3.16853046,23.888902984558108Q3.22324938,23.970795984558105,3.29289329,24.040439984558105Q3.36253726,24.110082984558105,3.44442981,24.164801984558103Q3.52632242,24.219520984558105,3.6173166,24.257212984558105Q3.70831078,24.294903984558104,3.80490969,24.314117984558106Q3.9015086,24.333332984558105,4,24.333333984558106Z" fill-rule="evenodd" fill="#1D2129" fill-opacity="1"/>
                    </g>
                    <g>
                      <path d="M9.333333969116211,19.33333396911621L27.99999996911621,19.33333396911621L27.99999996911621,27.333335869116212L9.333333969116211,27.333335869116212L9.333333969116211,23.33333396911621L9.333333969116211,19.33333396911621Z" fill="#FF7D00" fill-opacity="1"/>
                    </g>
                    <g>
                      <path d="M9.333333969116211,4.6666669845581055L27.99999996911621,4.6666669845581055L27.99999996911621,12.666666984558105L9.333333969116211,12.666666984558105L9.333333969116211,8.666666784558105L9.333333969116211,4.6666669845581055Z" :fill="flow.isActive ? '#FFFFFF' : '#4150FF'"  fill-opacity="1"/>
                    </g>
                  </g>
                </svg>
                <svg v-if="flow.app_name === '全部'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="24.5" height="24.5" viewBox="0 0 24.5 24.5">
                  <g>
                    <path d="M18.5,0C15.186292,0,12.5,2.6862917,12.5,6C12.5,9.3137083,15.186292,12,18.5,12C21.813709,12,24.5,9.3137083,24.5,6C24.5,2.6862917,21.813709,0,18.5,0ZM14.5,6C14.5,3.7908614,16.290861,2,18.5,2C20.709139,2,22.5,3.7908614,22.5,6C22.5,8.2091389,20.709139,10,18.5,10C16.290861,10,14.5,8.2091389,14.5,6ZM0,2.5C0,1.3954306,0.89543056,0.5,2,0.5C2,0.5,9,0.5,9,0.5C10.104569,0.5,11,1.3954306,11,2.5C11,2.5,11,9.5,11,9.5C11,10.604569,10.104569,11.5,9,11.5C9,11.5,2,11.5,2,11.5C0.89543056,11.5,0,10.604569,0,9.5C0,9.5,0,2.5,0,2.5ZM2,2.5C2,2.5,2,9.5,2,9.5C2,9.5,9,9.5,9,9.5C9,9.5,9,2.5,9,2.5C9,2.5,2,2.5,2,2.5ZM0,15.5C0,14.395431,0.89543056,13.5,2,13.5C2,13.5,9,13.5,9,13.5C10.104569,13.5,11,14.395431,11,15.5C11,15.5,11,22.5,11,22.5C11,23.604568,10.104569,24.5,9,24.5C9,24.5,2,24.5,2,24.5C0.89543056,24.5,0,23.604568,0,22.5C0,22.5,0,15.5,0,15.5ZM2,15.5C2,2.5,2,22.5,2,22.5C2,22.5,9,22.5,9,22.5C9,22.5,9,15.5,9,15.5C9,15.5,2,15.5,2,15.5ZM13,15.5C13,14.395431,13.895431,13.5,15,13.5C15,13.5,22,13.5,22,13.5C23.104568,13.5,24,14.395431,24,15.5C24,15.5,24,22.5,24,22.5C24,23.604568,23.104568,24.5,22,24.5C22,24.5,15,24.5,15,24.5C13.895431,24.5,13,23.604568,13,22.5C13,22.5,13,15.5,13,15.5ZM15,22.5C15,22.5,22,22.5,22,22.5C22,22.5,22,15.5,22,15.5C22,15.5,15,15.5,15,15.5C15,15.5,15,22.5,15,22.5Z" :fill="flow.isActive ? '#FFFFFF' : '#4150FF'" fill-opacity="1"/>
                  </g>
                </svg>
              </div>
              <div class="card-footer">
                <span class="status-text">运行中</span>
                <span class="count">{{ flow.running_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用会话区域 -->
      <div class="app-chat-section">
        <div class="section-header">
          <div class="section-icon">
            <img src="../../assets/svg/sessionManagement.svg"/>
          </div>
          <h2 class="section-title">应用会话</h2>
        </div>
          <div class="chat-actions">
            <button class="action-btn secondary" @click="refreshChats">刷新会话</button>
            <button class="action-btn" @click="createNewChat">新建对话</button>
          </div>
        <!-- 会话列表表格 -->
        <div class="chat-table">
          <div class="table-header">
            <div class="col col-name">应用/流程</div>
            <div class="col col-id">会话ID</div>
            <div class="col col-user">用户</div>
            <div class="col col-run-status">运行状态</div>
            <div class="col col-chat-status">会话状态</div>
            <div class="col col-actions">操作</div>
          </div>
          <div class="table-body">
            <div 
              v-for="chat in chatList" 
              :key="chat.id"
              class="table-row"
            >
              <div class="col col-name">{{ chat.flowName }}</div>
              <div class="col col-id">{{ chat.sessionId }}</div>
              <div class="col col-user">{{ chat.user }}</div>
              <div class="col col-run-status">{{ chat.runStatus }}</div>
              <div class="col col-chat-status">{{ chat.chatStatus }}</div>
              <div class="col col-actions">
                <span
                  class="btn-action btn-view"
                  @click.stop="viewChat(chat)">会话</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStatusStore, useChatHistoryStore, useChatMessageStore, useCommonStore } from '@/store';
import { getFlowList, createSession, type FlowItem } from '@/api/homePageApi';
import { useNewConversation, useSessionList } from '@/hooks';

const router = useRouter();
const chatStatusStore = useChatStatusStore();
const chatHistoryStore = useChatHistoryStore();
const chatMessageStore = useChatMessageStore();
const commonStore = useCommonStore();

// 应用流程数据
const flowList = ref<FlowItem[]>([]);

// 当前选中的流程
const activeFlow = ref<FlowItem | null>(null);

// 使用会话列表hooks
const {
  sessionList,
  isLoading: sessionLoading,
  updateSessionList,
  refreshSessionList,
  viewSession
} = useSessionList();

// 重命名sessionList为chatList以保持模板兼容性
const chatList = sessionList;

// 获取流程列表数据
const fetchFlowList = async () => {
  try {
    const apiData = await getFlowList();
    
    // 添加默认的"全部"选项
    const allOption: FlowItem = {
      workflow_id: 'all',
      app_name: '全部',
      workflow_name: '支持所有类型会话',
      running_count: 0,
      isActive: true
    };
    
    // 转换接口数据格式并添加isActive属性
    const processedData = apiData.map((item: FlowItem) => ({
      ...item,
      isActive: false
    }));
    
    flowList.value = [allOption, ...processedData];
    activeFlow.value = allOption;
    updateSessionList(activeFlow.value.workflow_id);
  } catch (error) {
    console.error('获取流程列表失败：', error);
    // 如果API请求失败，使用默认数据
    flowList.value = [{
      workflow_id: 'all',
      app_name: '全部',
      workflow_name: '支持所有类型会话',
      running_count: 0,
      isActive: true
    }];
    activeFlow.value = flowList.value[0];
    updateSessionList(activeFlow.value.workflow_id);
  }
};



// 选择流程
const selectFlow = async (flow: FlowItem) => {
  flowList.value.forEach(f => f.isActive = false);
  flow.isActive = true;
  
  // 设置当前选中的流程到本地状态
  activeFlow.value = flow;
  
  // 同时设置到全局状态，供其他组件使用
  commonStore.setActiveFlow(flow);
  
  // 调用独立函数更新会话列表，实现应用会话与应用流程的联动
  await updateSessionList(flow.workflow_id);
};

// 使用新建对话hooks
const { createNewConversation } = useNewConversation();

// 新建对话
const createNewChat = async () => {
  await createNewConversation({ shouldNavigate: true });
};

// 刷新会话
const refreshChats = () => {
  refreshSessionList(activeFlow.value.workflow_id);
};

// 查看会话
const viewChat = (chat: any) => {
  viewSession(chat, flowList.value);
};

// 组件挂载时获取流程列表
onMounted(() => {
  fetchFlowList();
});

</script>

<style scoped>
.home-page {
  min-height: 100vh;
  /* background-image: url("../../assets/imgs/global-bg.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover; */
  background: #F3F3F4;
  padding: 20px;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.header-icon {
  width: 36px;
  height: 36px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 32px;
  height: 32px;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 0 auto;
  height: calc(100vh - 108px);
  overflow: hidden;
}

.app-flow-section,
.app-chat-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.app-flow-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 99%);
}
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: flex-start;
}

.section-header > div {
  display: flex;
  align-items: center;
}

.section-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  /* color: #6b7280; */
  img {
    width: 100%;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.flow-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 130px;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  align-content: start;
}

.flow-card {
  background: #fff;
  color: #1D2129;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 1px solid #DCDDE1;
  height: 130px;
  box-sizing: border-box;
  min-width: 0;
}

.card-content {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* .flow-card:hover {
  transform: translateY(-2px);
} */

.flow-card.active {
  background: #4150FF;
  color: #fff;
  border: 1px solid #4150FF
}

.card-content h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-content .des-wrapper {
  margin: 0 0 4px 0;
  width: 100%;
  min-width: 0;
  padding-top: 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;

  .des {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
  }

  img {
    width: 24px;
    height: 24px;
    margin-top: -10px;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.count {
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.chat-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #3b82f6;
  color: white;
}

.action-btn:hover {
  background: #2563eb;
}

.action-btn.secondary {
  background: #10b981;
}

.action-btn.secondary:hover {
  background: #059669;
}

.chat-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 0.7fr;
  gap: 8px;
  background: #F3F3F4;
  padding: 12px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #1D2129;
  height: 42px;
  box-sizing: border-box;
}

.table-body {
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  max-height: calc(100% - 100px);
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 0.5fr;
  gap: 8px;
  padding: 12px 8px;
  font-size: 14px;
  line-height: 22px;
  border-bottom: 1px solid #E7E8EB;
  cursor: pointer;
  transition: background 0.2s ease;
}
.table-row .col-run-status,
.table-row .col-chat-status
{
  color: #FF4A4A;
}
.table-row:hover {
  /* background: #f9fafb; */
}

.col {
  display: flex;
  align-items: center;
}

.col-actions {
  display: flex;
  gap: 4px;
}

.btn-action {
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view {
  color: #1d4ed8;
}

.btn-view:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fecaca;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fca5a5;
}

.btn-export {
  background: #d1fae5;
  color: #059669;
}

.btn-export:hover {
  background: #a7f3d0;
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .flow-cards {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 12px;
  }
  
  .app-flow-section,
  .app-chat-section {
    padding: 16px;
  }
  
  .flow-cards {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .col {
    padding: 4px 0;
  }
}
</style>