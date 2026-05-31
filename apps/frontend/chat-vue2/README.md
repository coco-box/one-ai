# Vue 2.6 + Composition API 应用

这是一个使用 Vue 2.6 + Composition API + Vue CLI 创建的简单列表应用。

## 功能特性

- ✅ Vue 2.6 + Composition API
- ✅ TypeScript 支持
- ✅ 使用 `defineComponent` + `setup` 语法
- ✅ 简单的列表展示
- ✅ 底部输入框添加功能
- ✅ 删除列表项功能
- ✅ 响应式设计

## 项目结构

```
chat-runtime-vue2/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── views/
│   │   └── Home.vue          # 首页组件
│   ├── router/
│   │   └── index.ts          # 路由配置
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   └── shims-vue.d.ts        # Vue 类型声明
├── package.json
├── vue.config.js
├── tsconfig.json
└── .eslintrc.js
```

## 安装依赖

```bash
cd /Users/lance/Documents/company/istorm-aiagent-webui/apps/chat-runtime-vue2
npm install
```

## 运行项目

```bash
# 开发模式
npm run serve

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 使用说明

1. 在底部输入框中输入内容
2. 点击"添加"按钮或按回车键添加到列表
3. 点击列表项右侧的"删除"按钮可以删除对应项目
4. 支持移动端响应式布局

## 技术栈

- Vue 2.6.14
- @vue/composition-api 1.7.2
- Vue Router 3.6.5
- TypeScript
- Vue CLI 5.x
