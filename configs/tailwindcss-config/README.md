# @coco-box/ai-tailwindcss-config

该包提供了一套可共享的 Tailwind CSS 主题配置，包含亮色（light）和暗色（dark）两套主题。

## 安装

```bash
pnpm add @coco-box/ai-tailwindcss-config -w
```

## 使用方法

### 1. 引入主题文件

您需要在项目的入口 CSS 文件中引入本包提供的 `theme.css`。

例如，在您的 `main.css` 或类似的全局样式文件中：

```css
@import '@coco-box/ai-tailwindcss-config/theme.css';
```

### 2. 配置 `tailwind.config.js`

为了让 Tailwind 能够识别和使用这些 CSS 变量，您需要像下面这样扩展您的 `tailwind.config.js` 文件。这会将 `theme.css` 中定义的颜色变量（如 `--text-primary`, `--bg-primary` 等）映射到 Tailwind 的配置中。

```js
const sharedConfig = require('@coco-box/ai-tailwindcss-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 继承共享配置
  presets: [sharedConfig],
  
  // 在您自己的项目中定义的内容来源
  content: [
    './index.html', 
    './src/**/*.{vue,js,ts,jsx,tsx}',
    // 如果您引用了 ui 包，也需要包含它
    '../../packages/ui/src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  
  // 启用暗黑模式切换
  darkMode: 'class', // 关键：通过 class 来切换
  
  theme: {
    extend: {
      // 使用 CSS 变量来定义颜色
      colors: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'tertiary': 'var(--text-tertiary)',
        'on-primary-bg': 'var(--text-on-primary-bg)',
      },
      backgroundColor: {
        'primary': 'var(--bg-primary)',
        'primary-hover': 'var(--bg-primary-hover)',
        'primary-active': 'var(--bg-primary-active)',
        'primary-disabled': 'var(--bg-primary-disabled)',
        'danger': 'var(--bg-danger)',
        'danger-hover': 'var(--bg-danger-hover)',
        'danger-active': 'var(--bg-danger-active)',
        'danger-disabled': 'var(--bg-danger-disabled)',
        'one-global': 'var(--one-global-bg)',
        'one-global-normal': 'var(--one-global-bg-normal)',
        // ... 您可以根据需要映射 theme.css 中的所有背景色变量
      }
      // ... 其他您想要扩展的主题配置
    },
  },
  plugins: [],
};
```

### 3. 切换主题

本主题系统通过 CSS 变量和在容器元素上添加 `dark` 类来实现亮暗模式的切换。

我们推荐使用 `@coco-box/one-ai` 包中提供的 `OneConfigProvider` 组件来管理主题。

#### 推荐方案：使用 OneConfigProvider

这是最简单、最推荐的方式。`OneConfigProvider` 会为您自动处理主题的切换。

1. 在您的应用入口处，使用 `OneConfigProvider` 包裹您的应用。
2. 创建一个本地的状态变量来控制主题（例如，`'light'` 或 `'dark'`）。
3. 将这个状态变量作为 `theme` prop 传给 `OneConfigProvider`。

**示例 (`App.vue`):**

```vue
<template>
  <OneConfigProvider :theme="currentTheme">
    <!-- 您应用的其他部分 -->
    <YourApp />
    <button @click="toggle">切换主题</button>
  </OneConfigProvider>
</template>

<script>
import { ref } from '@vue/composition-api';
import { OneConfigProvider } from '@coco-box/ai-ui';

export default {
  components: { OneConfigProvider },
  setup() {
    const currentTheme = ref('light'); // 'light' | 'dark'

    const toggle = () => {
      currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    };

    return { currentTheme, toggle };
  }
}
</script>
```

这样，当 `currentTheme` 变化时，`OneConfigProvider` 内部的所有 `@coco-box/ai-ui` 组件都会自动更新其外观，而不会影响到您应用中其他不相关的部分。

#### 手动方案

如果您不想使用 `OneConfigProvider`，也可以手动在您的应用根元素上添加或移除 `.dark` 类。所有嵌套在该元素内部的本组件库组件都会响应这个变化。

```html
<!-- 当 class="dark" 时，内部组件将切换为暗黑主题 -->
<div id="app" :class="isDark ? 'dark' : ''">
  <OneButton />
</div>
```
