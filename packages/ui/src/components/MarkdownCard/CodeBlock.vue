<template>
  <div class="one-code-block" :class="themeClass" ref="rootRef">
    <div class="one-code-block-header" v-if="!$scopedSlots.header">
      <slot name="lang">
        <span class="one-code-lang">{{ language }}</span>
      </slot>
      <slot name="actions">
        <div class="one-code-block-actions">
          <div v-if="isMermaid" style="margin-right: 8px">
            <ul class="one-diagram-switch" :class="{ 'one-show-code': !showMermaidDiagram }">
              <li @click="showMermaidDiagram = true" :class="{ 'one-diagram-switch-active': showMermaidDiagram }">图形</li>
              <li @click="showMermaidDiagram = false" :class="{ 'one-diagram-switch-active': !showMermaidDiagram }">代码</li>
            </ul>
          </div>
          <div
            v-if="isMermaid && showMermaidDiagram"
            class="one-action-btn one-toggle-btn one-flex one-justify-center one-items-center one-box-border"
            title="放大"
            @click="zoomIn"
          >
            <EnlargeIcon />
          </div>
          <div
            v-if="isMermaid && showMermaidDiagram"
            class="one-action-btn one-toggle-btn one-flex one-justify-center one-items-center one-box-border"
            title="缩小"
            @click="zoomOut"
          >
            <ZoomOut2Icon />
          </div>
          <div
            v-if="isMermaid && showMermaidDiagram"
            class="one-action-btn one-toggle-btn one-flex one-justify-center one-items-center one-box-border"
            title="下载"
            @click="download"
          >
            <Download2Icon />
          </div>
          <div
            class="one-action-btn one-toggle-btn one-flex one-justify-center one-items-center one-box-border"
            title="收起/展开"
            @click="toggleExpand">
            <AllCollapseIcon />
          </div>
          <div
            class="one-action-btn one-copy-btn one-flex one-justify-center one-items-center one-box-border"
            title="复制"
            @click="copyCode">
            <CopyNewIcon v-if="!copied" />
            <RightIcon v-else />
          </div>
        </div>
      </slot>
    </div>
    <slot name="header" v-else />
    <transition
      name="collapse-transition"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div v-show="expanded">
        <div v-if="isMermaid && showMermaidDiagram && !$scopedSlots.content" class="one-mermaid-content" />
        <pre v-else-if="!$scopedSlots.content">
          <code :class="`hljs language-${language}`" v-html="highlightedCode" />
        </pre>
        <slot v-else name="content" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, watch, onMounted, type PropType } from '@vue/composition-api';
import hljs from 'highlight.js';
import { debounce } from 'lodash';
import { MDCardService } from './MDCardService';
import { MermaidService } from './MermaidService';

import AllCollapseIcon from './components/allCollapseIcon.vue';
import CopyNewIcon from './components/copyNewIcon.vue';
import RightIcon from './components/rightIcon.vue';
import EnlargeIcon from './components/enlarge.vue';
import ZoomOut2Icon from './components/zoomOut2.vue';
import Download2Icon from './components/download2.vue';

type MermaidConfig = {
  theme?: string;
};

export default defineComponent({
  name: 'OneCodeBlock',
  props: {
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: '',
    },
    blockIndex: {
      type: Number,
      required: true,
    },
    theme: {
      type: String,
      default: 'light',
    },
    enableMermaid: {
      type: Boolean,
      default: false
    },
    mermaidConfig: {
      type: Object as PropType<MermaidConfig>,
      default: () => ({})
    },
    defaultExpanded: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    AllCollapseIcon,
    CopyNewIcon,
    RightIcon,
    EnlargeIcon,
    ZoomOut2Icon,
    Download2Icon,
  },
  setup(props) {
    const mdCardService = new MDCardService();
    let mermaidService: any = null;

    const expanded = ref(props.defaultExpanded);
    const copied = ref(false);
    const mermaidContent = ref('');
    const showMermaidDiagram = ref(true);
    const isMermaid = computed(() => props.enableMermaid && props.language?.toLowerCase() === 'mermaid');

    const highlightedCode = computed(() => {
      try {
        const typeIndex = props.code.indexOf('<span class="one-typewriter');

        let content: string;
        if (props.language && hljs.getLanguage(props.language)) {
          if (typeIndex !== -1) {
            content = hljs.highlight(props.code.slice(0, typeIndex), { language: props.language }).value + props.code.slice(typeIndex);
          } else {
            content = hljs.highlight(props.code, { language: props.language }).value;
          }
        } else if (typeof hljs.highlightAuto !== 'undefined') {
          if (typeIndex !== -1) {
            content = hljs.highlightAuto(props.code.slice(0, typeIndex)).value + props.code.slice(typeIndex);
          } else {
            content = hljs.highlightAuto(props.code).value;
          }
        } else {
          content = mdCardService.filterHtml(props.code);
        }

        return content;
      } catch (_) {}
    });

    const rootRef = ref<HTMLElement | null>(null);

    const zoomIn = () => {
      const container = rootRef.value?.querySelector('.one-mermaid-content');
      if (container && mermaidService) {
        mermaidService.zoomIn(container);
      }
    };
    const zoomOut = () => {
      const container = rootRef.value?.querySelector('.one-mermaid-content');
      if (container && mermaidService) {
        mermaidService.zoomOut(container);
      }
    };
    const download = () => {
      const container = rootRef.value?.querySelector('.one-mermaid-content');
      if (container && mermaidService) {
        mermaidService.download(container);
      }
    };

    const renderMermaid = async () => {
      if (!isMermaid.value || !props.code) {
        return;
      }
      if (!mermaidService) {
        try {
          // const { MermaidService } = await import('./MermaidService');
          const config: MermaidConfig = {
            theme: props.theme === 'dark' ? 'dark' : 'default',
            ...props.mermaidConfig
          };
          mermaidService = new MermaidService(config);
        } catch (error) {
          console.error('Failed to load MermaidService:', error);
          // 如果 mermaid 不可用，显示提示信息而不是直接返回
          showMermaidDiagram.value = false;
          mermaidContent.value = 'Mermaid diagrams are not available. Please install mermaid to use this feature.';
          return;
        }
      }
      nextTick(async () => {
        const container = rootRef.value?.querySelector('.one-mermaid-content');
        if (container) {
          await mermaidService.renderToContainer(container, props.code.replace(/<span[^>]*\bclass\s*=\s*['"]one-typewriter[^>]*>([\s\S]*?)<\/span>/g, '$1'), props.theme as 'light' | 'dark');
        }
      });
    };

    const toggleExpand = () => {
      expanded.value = !expanded.value;
    };

    const copyCode = debounce((e: Event) => {
      const target = e.target as HTMLElement;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(props.code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        textarea.style.zIndex = '-1';
        textarea.value = props.code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      target.classList.remove('icon-copy-new');
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 1500);
    }, 300);

    const beforeEnter = (el: any) => {
      if (!el.dataset) {
        el.dataset = {};
      }
      if (el.style.height) {
        el.dataset.height = el.style.height;
      }
      el.style.maxHeight = 0;
    };

    const enter = (el: any) => {
      requestAnimationFrame(() => {
        el.dataset.oldOverflow = el.style.overflow;
        if (el.dataset.height) {
          el.style.maxHeight = el.dataset.height;
        } else if (el.scrollHeight !== 0) {
          el.style.maxHeight = `${el.scrollHeight}px`;
        } else {
          el.style.maxHeight = 0;
        }
        el.style.overflow = 'hidden';
      });
    };

    const afterEnter = (el: any) => {
      el.style.maxHeight = '';
      el.style.overflow = el.dataset.oldOverflow || '';
    };

    const beforeLeave = (el: any) => {
      if (!el.dataset) {
        el.dataset = {};
      }
      el.dataset.oldOverflow = el.style.overflow;
      el.style.maxHeight = `${el.scrollHeight}px`;
      el.style.overflow = 'hidden';
    };

    const leave = (el: any) => {
      if (el.scrollHeight !== 0) {
        el.style.maxHeight = '0';
      }
    };

    const afterLeave = (el: any) => {
      el.style.maxHeight = '';
      el.style.overflow = el.dataset.oldOverflow;
    };

    const themeClass = computed(() =>
      props.theme === 'dark' ? 'one-code-block-dark' : 'one-code-block-light'
    );

    watch(() => [props.code, props.theme, props.enableMermaid], () => {
      if (isMermaid.value) {
        nextTick(() => {
          renderMermaid();
        });
      }
    }, { immediate: true });

    watch(
      () => showMermaidDiagram.value,
      (val) => {
        if (val && isMermaid.value) {
          nextTick(() => {
            renderMermaid();
          });
        }
      }
    );

    onMounted(() => {
      if (isMermaid.value) {
        renderMermaid();
      }
    });

    return {
      rootRef,
      expanded,
      copied,
      themeClass,
      highlightedCode,
      toggleExpand,
      copyCode,
      beforeEnter,
      enter,
      afterEnter,
      beforeLeave,
      leave,
      afterLeave,
      showMermaidDiagram,
      isMermaid,
      zoomIn,
      zoomOut,
      download,
    };
  },
});
</script>

<style lang="scss" scoped>
@use "sass:meta";
.one-code-block-light ::v-deep {
  @include meta.load-css("highlight.js/styles/a11y-light");
}
.one-code-block-dark ::v-deep {
  @include meta.load-css("highlight.js/styles/a11y-dark");
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.one-code-block {
  overflow: hidden;
  border-radius: 14px;

  pre {
    padding: 0;
    margin: 0;
    line-height: 1.6;
    display: flex;
  }

  .one-action-btn {
    width: 24px;
    height: 24px;
  }

  .one-code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    .one-code-lang {
      font-size: var(--one-font-size-md);
    }
  }

  .one-mermaid-content {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
    background: inherit;
  }

  .one-code-block-actions {
    display: flex;
    align-items: center;
    .one-copy-btn,
    .one-toggle-btn {
      cursor: pointer;
      border-radius: 4px;
      font-size: 18px;
      padding: 4px;
    }
  }
  .one-diagram-switch {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 2px;
    border-radius: 4px;
    background-color: var(--one-icon-hover-bg);
    position: relative;
    transition: all 0.3s ease;
    overflow: hidden;
    height: 24px;

    &::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: calc(50% - 2px);
      height: calc(100% - 4px);
      background-color: var(--one-base-bg);
      border-radius: 4px;
      transition: transform 0.3s ease;
      box-shadow: 0 1px 2px var(--one-box-shadow);
      z-index: 1;
    }

    &.one-show-code::before {
      transform: translateX(100%);
    }

    .one-diagram-switch-active {
      text-shadow: 0 0 .4px var(--one-text);
    }

    li {
      position: relative;
      padding: 0 8px;
      font-size: 12px;
      cursor: pointer;
      transition: color 0.3s ease;
      z-index: 2;
      user-select: none;
      width: 50%;
      text-align: center;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      line-height: initial;
    }
  }
}

.one-code-block-light {
  border: 1px solid var(--one-table-border-color);
  code.hljs {
    padding: 1em;
    display: block;
    margin: 0;
    flex: 1;
    background: var(--one-code-content-bg);
  }
  background-color: var(--one-code-header-bg);
  .one-code-lang {
    color: var(--text-primary);
  }
  .one-code-block-actions {
    .one-copy-btn,
    .one-toggle-btn {
      color: var(--text-primary);
      &:hover {
        background-color: var(--one-code-content-bg);
      }
    }
  }
  .one-mermaid-content {
    background: var(--one-code-content-bg);
  }
}

.one-code-block-dark {
  border: 1px solid var(--one-table-border-color);
  code.hljs {
    padding: 1em;
  }
  background-color: var(--one-code-header-bg);
  .one-code-lang {
    color: var(--text-primary);
  }
  .one-code-block-actions {
    .one-copy-btn,
    .one-toggle-btn {
      color: var(--text-primary);
      &:hover {
        background-color: var(--one-code-content-bg);
      }
      img {
        filter: brightness(1.5);
      }
    }
  }
  .one-mermaid-content {
    background: var(--one-code-content-bg);
  }
}

.collapse-transition {
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }

  &-enter-to,
  &-leave-from {
    opacity: 1;
  }

  &-enter-active,
  &-leave-active {
    transition: max-height 0.3s cubic-bezier(0.5, 0.05, 0.5, 0.95),
      opacity 0.3s cubic-bezier(0.5, 0.05, 0.5, 0.95);
  }
}
</style>

<style>
div[id^="done_mermaid"] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: -9999;
}
</style>