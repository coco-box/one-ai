<!-- <template>
  NOTE: 不使用 template 标签，因为在 Vue2 + Composition API 中，不能在 watch 或 setup 的普通函数中直接调用 h 函数创建 VNode。h 函数必须在渲染上下文中调用。解决方案： 改用 render 函数
  <div class="one-markdown-render" :class="themeClass">
    <component :is="markdownComponent" />
  </div>
  NOTE: 标记下，下边三个插槽其实是 CodeBlock 的插槽，方便开发时知道有四个插槽处理
  <div v-if="false">
    <slot name="lang" />
    <slot name="actions" />
    <slot name="header" />
    <slot name="content" />
  </div>
</template> -->

<script lang="ts">
import hljs from 'highlight.js';
import markdownit from 'markdown-it';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type { VNode } from 'vue';
import { defineComponent, computed, h, nextTick, onMounted, onBeforeUnmount, ref, watch, type SetupContext } from '@vue/composition-api';
import { throttle } from 'lodash';
import { Fragment, useSlots } from '../../utils'; // 调用 polyfill 以支持 Vue2 语法
import CodeBlock from './CodeBlock.vue';
import { MDCardService } from './MDCardService';
import { type CodeBlockSlot, defaultTypingConfig, mdCardProps, type MdCardProps } from './mdCard-types';
import { useDevicePerformance } from '../../utils/hooks/useDevicePerformance';
import { tokensToAst, htmlToVNode, type ASTNode, isValidTagName } from './MDCardParser';

export default defineComponent({
  name: 'OneMarkdownCard',
  props: mdCardProps,
  emits: ['afterMdtInit', 'typingStart', 'typing', 'typingEnd'],
  setup(props: MdCardProps, { emit }: SetupContext) {
    const mdCardService = new MDCardService();
    const slots = useSlots();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const mdt: MarkdownIt = markdownit({
      breaks: true,
      linkify: true,
      html: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (_) {}
        }
        return '';
      },
      ...props.mdOptions,
    });

    const typingIndex = ref(0);
    const isTyping = ref(false);

    // 存储解析后的内容字符串，而不是 VNode
    const parsedContent = ref('');
    const parsedVNodes = ref<ASTNode[]>([]);

    const parseContent = () => {
      try {
        let content = props.content || '';
        if (props.typing && isTyping.value) {
          content = props.content.slice(0, typingIndex.value) || '';
          const options = { ...defaultTypingConfig, ...props?.typingOptions };

          if (options.style === 'cursor') {
            content += '<span class="one-typewriter one-typewriter-cursor">|</span>';
          } else if (options.style === 'color' || options.style === 'gradient') {
            content = `${content.slice(0, -5)}<span class="one-typewriter one-typewriter-${options.style}">${content.slice(-5)}</span>`;
          }
        }

        if (props.enableThink) {
          const thinkClass = props.thinkOptions?.customClass || 'one-think-block';
          content = content
            ?.replace('<think>', `<div class="${thinkClass}">`)
            .replace('</think>', '</div>') || '';
        }

        // 存储原始内容和解析后的 AST
        parsedContent.value = content;
        const tokens = mdt.parse(content, {});
        const ast = tokensToAst(tokens);
        parsedVNodes.value = ast;
      } catch (error) {
        parsedContent.value = 'Error parsing content';
        parsedVNodes.value = [];
      }
    };

    const astToVnodes = (nodes: ASTNode[]): VNode[] => nodes.map((node) => processASTNode(node));

    const processASTNode = (node: ASTNode | Token): VNode => {
      if (node.nodeType === 'html_inline' || node.nodeType === 'html_block') {
        const outerVnode: VNode = htmlToVNode(node.openNode?.content || '')[0] as VNode;
        if (outerVnode) {
          const outerChildren = outerVnode?.children || [];
          if (Array.isArray(outerChildren)) {
            outerVnode.children = [...outerChildren, ...node.children.map((child) => processASTNode(child))];
          } else {
            outerVnode.children = [outerChildren, ...node.children.map((child) => processASTNode(child))];
          }
          return outerVnode;
        }
        return node.openNode?.content || '';
      }

      if (node.nodeType === 'inline') {
        const html = mdt.renderer.render([node.openNode], mdt.options, {});
        const vNodes = htmlToVNode(html);
        return h(Fragment, {}, vNodes);
      }

      if (isToken(node)) {
        return processToken(node);
      }

      return processASTNodeInternal(node);
    };

    const isToken = (node: ASTNode | Token): node is Token => 'type' in node && 'content' in node;

    const processToken = (token: Token): VNode => {
      if (token.type === 'text') {
        return token.content;
      }

      if (token.type === 'inline') {
        return processInlineToken(token);
      }

      if (token.type === 'fence') {
        return processFenceToken(token);
      }

      if (token.type === 'softbreak') {
        return mdt.options.breaks ? h('br') : '\n';
      }

      if (token.type === 'html_block' || token.type === 'html_inline') {
        return token.type === 'html_block' ? h('div', { domProps: { innerHTML: token.content } }) : h('span', { domProps: { innerHTML: token.content } });
      }

      if (token.type === 'math_block' && token.markup === '$$') {
        const html = mdt.renderer.render([token], mdt.options, {});
        const vNode = htmlToVNode(html);
        return h(Fragment, {}, vNode);
      }

      // 优先使用token的tag属性
      if (token.tag) {
        const tagName = isValidTagName(token.tag) ? token.tag : 'div';
        const attrs = convertAttrsToProps(token.attrs || []);
        return h(tagName, { attrs, key: token.vNodeKey }, token.content);
      }

      return token.content;
    };

    const processInlineToken = (token: Token): VNode => {
      const html = mdt.renderer.render([token], mdt.options, {});
      const vNodes = htmlToVNode(html);
      return h(Fragment, {}, vNodes);
    };

    const processASTNodeInternal = (node: ASTNode): VNode => {
      let tagName = 'div';
      if (node.openNode?.tag && isValidTagName(node.openNode?.tag)) {
        tagName = node.openNode?.tag;
      }
      const attrs = convertAttrsToProps(node.openNode?.attrs || []);

      // 特殊处理fence类型的token
      if (node.openNode?.type === 'fence') {
        return processFenceToken(node.openNode);
      }

      // 处理所有带tag的AST节点
      if (node.openNode?.tag) {
        const tagName = isValidTagName(node.openNode?.tag) ? node.openNode?.tag : 'div';

        // 特殊处理 table 标签：包装一个 div.md-table-wrapper
        if (tagName === 'table') {
          return processTableNode(node);
        }

        const children = node.children.map((child) => processASTNode(child));
        const attrs = convertAttrsToProps(node.openNode?.attrs || []);
        return h(tagName, { attrs, key: node.vNodeKey }, children);
      }

      const children = node.children.map((child) => processASTNode(child));

      return h(tagName, { attrs, key: node.vNodeKey }, children);
    };

    const processFenceToken = (token: Token): VNode => {
      const language = token.info?.replace(/<span\b[^>]*>/i, '').replace('</span>', '') || '';
      const code = token.content;
      return createCodeBlock(language, code, token.tokenIndex);
    };

    const processTableNode = (node: ASTNode): VNode => {
      const children = node.children.map((child) => processASTNode(child));
      const attrs = convertAttrsToProps(node.openNode?.attrs || []);
      return createTableWrapper(children, attrs, node.vNodeKey);
    };

    const convertAttrsToProps = (attrs: [string, string][]): Record<string, string> => attrs.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    watch(
      () => [props.enableThink, props.thinkOptions?.customClass, props.theme],
      () => {
        parseContent();
      }
    );

    const createCodeBlock = (
      language: string,
      code: string,
      blockIndex: number,
    ) => {
      const codeBlockSlots: CodeBlockSlot = {
        lang: slots.lang
          ? () => slots.lang?.({ codeBlockData: { code, language } }) || null
          : undefined,
        actions: slots.actions
          ? () => slots.actions?.({ codeBlockData: { code, language } }) || null
          : undefined,
        header: slots.header
          ? () => slots.header?.({ codeBlockData: { code, language } }) || null
          : undefined,
        content: slots.content
          ? () => slots.content?.({ codeBlockData: { code, language } }) || null
          : undefined,
      };
      return h(
        CodeBlock,
        {
          props: {
            language,
            code,
            blockIndex,
            theme: props.theme,
            enableMermaid: props.enableMermaid,
            mermaidConfig: props.mermaidConfig,
            defaultExpanded: props.defaultExpanded,
          },
          key: `code-block-${blockIndex}`,
          scopedSlots: codeBlockSlots as any,
        },
        // codeBlockSlots, // vue3 的这种写法在 vue2 中得按上面那种写法 scopedSlots
      );
    };

    const createTableWrapper = (
      children: VNode[],
      attrs: Record<string, string>,
      vNodeKey: string,
    ) =>
      // 包装 table 标签：添加一个 div.one-md-table-wrapper 用于横向滚动和样式优化
      h('div', { class: 'one-md-table-wrapper', key: `${vNodeKey}-wrapper` }, [
        h('table', { attrs, key: vNodeKey }, children)
      ]);

    const typewriterStart = () => {
      clearTimeout(timer!);

      isTyping.value = true;
      emit('typingStart');
      const options = { ...defaultTypingConfig, ...props?.typingOptions };

      const typingStep = () => {
        let { step } = options;
        if (Array.isArray(options.step)) {
          step = options.step[0] + Math.floor(Math.random() * (options.step[1] - options.step[0]));
        }
        typingIndex.value += step;
        parseContent();
        emit('typing');

        if (typingIndex.value >= props.content!.length) {
          typewriterEnd();
          parseContent();
          return;
        }

        timer = setTimeout(typingStep, options.interval);
      };

      timer = setTimeout(typingStep);
    };

    // ========== 自适应节流渲染系统 ==========

    // 设备性能检测 (全局单例)
    const devicePerf = useDevicePerformance();

    /**
     * 节流 + 空闲时执行的混合策略
     * 
     * 1. throttle: 控制调用频率（避免过度调用）
     * 2. requestIdleCallback: 在浏览器空闲时执行（避免阻塞主线程）
     * 
     * 这样即使在低端设备上，也能保证 UI 响应性
     */
    let idleCallbackId: number | null = null;
    let isFirstRender = true;  // 标记是否首次渲染

    const throttledParseContent = throttle(
      () => {
        // 取消之前的 idle callback（如果有）
        if (idleCallbackId !== null) {
          cancelIdleCallback(idleCallbackId);
        }

        // 使用 requestIdleCallback 在浏览器空闲时执行
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(
            () => {
              parseContent();
              idleCallbackId = null;
            },
            { timeout: devicePerf.value.busyTimeout }  // 最多等待这么久
          );
        } else {
          // 降级到直接执行
          parseContent();
        }
      },
      devicePerf.value.busyTimeout,  // 根据设备性能决定节流频率
      {
        leading: false,   // 不立即执行第一次
        trailing: true,   // 尾部调用，确保最后一次一定执行
      }
    );

    watch(
      () => props.content,
      (newVal, oldVal) => {
        if (!props.typing) {
          typingIndex.value = newVal?.length || 0;

          // 首次渲染立即执行，不节流
          if (isFirstRender && newVal) {
            isFirstRender = false;
            parseContent();  // 直接调用，确保立即显示
          } else {
            throttledParseContent();  // 后续使用节流
          }
          return;
        }

        if (newVal.indexOf(oldVal) === -1) {
          typingIndex.value = 0;
        }

        nextTick(() => typewriterStart());
      },
      { immediate: true },
    );

    const typewriterEnd = () => {
      isTyping.value = false;
      emit('typingEnd');
    };

    watch(
      () => props.customXssRules,
      (rules) => {
        mdCardService.setCustomXssRules(rules);
        parseContent();
      },
      { deep: false },
    );

    watch(
      () => props.mdPlugins,
      (plugins) => {
        mdCardService.setMdPlugins(plugins, mdt);
        parseContent();
      },
      { immediate: true, deep: false },
    );

    const themeClass = computed(() => props.theme === 'dark'
      ? 'one-markdown-render-dark'
      : 'one-markdown-render-light');

    onMounted(() => {
      emit('afterMdtInit', mdt);
    });

    // 组件销毁时清理所有定时器和节流函数，防止内存泄漏
    onBeforeUnmount(() => {
      // 清理 typing 相关的 timer
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      // 取消节流函数的待执行任务
      throttledParseContent.cancel();

      // 取消待执行的 idle callback
      if (idleCallbackId !== null) {
        cancelIdleCallback(idleCallbackId);
        idleCallbackId = null;
      }
    });

    // 将 AST 转 VNode 的过程放入 computed，避免每次 render 都重新执行 expensive 的 DOMParser 操作
    const renderedVNodes = computed(() => {
      return parsedVNodes.value.length > 0 ? astToVnodes(parsedVNodes.value) : [];
    });

    // 返回 render 函数而不是模板数据
    return () => {
      const vnodes = renderedVNodes.value;

      return h('div', { class: ['one-markdown-render', themeClass.value] }, [
        h(Fragment, {}, vnodes)
      ]);
    };
  }
});
</script>
<style scoped lang="scss">
@use "./markdown.scss";

.one-markdown-render {
  font-size: var(--one-font-size-lg);
  line-height: var(--one-line-height-lg);
  overflow-x: auto;
  &.one-markdown-render-dark {
    color: var(--text-primary);
  }
  &.one-markdown-render-light {
    color: var(--text-primary);
  }
}

::v-deep {
  .one-think-block {
    color: var(--text-tertiary);
    border-left: 1px solid var(--one-line);
    padding-left: 12px;
    margin-bottom: 1rem;
  }
  .one-typewriter-color {
    background-image: -webkit-linear-gradient(left, #191919, #5588f0, #e171ee, #f2c55c);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .one-typewriter-gradient {
    background: linear-gradient(to right, var(--one-text), var(--one-base-bg));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .one-typewriter-cursor {
    font-weight: 900;
    animation: typewriter 800ms linear 0s infinite;
  }

  .one-md-table-wrapper {
    overflow-x: auto;
    max-width: 100%;
    margin: 1em 0;
    border: 1px solid var(--one-table-border-color);
    border-radius: 10px;

    table {
      margin: 0;
      border-collapse: collapse;
      width: max-content;
      min-width: 100%;
      max-width: max-content;
      table-layout: auto; // 自动列宽（配合 max-width）

      thead {
        tr {
          th {
            background-color: var(--one-code-header-bg);
            border-bottom: 1px solid var(--one-table-border-color);
            border-left: none; // 移除左边框，避免与外层边框重叠
            border-right: none; // 移除右边框，避免与外层边框重叠
            border-top: none; // 移除上边框，避免与外层边框重叠
            &:first-child {
              border-top-left-radius: 7px;
            }

            &:last-child {
              border-top-right-radius: 7px;
            }

            // 只在非最后一列添加右边框作为分隔线
            &:not(:last-child) {
              border-right: 1px solid var(--one-table-border-color);
            }
          }
        }
      }

      tbody {
        tr {
          td {
            border-bottom: 1px solid var(--one-table-border-color);
            border-left: none; // 移除左边框，避免与外层边框重叠
            border-right: none; // 移除右边框，避免与外层边框重叠
            border-top: none; // 移除上边框

            // 只在非最后一列添加右边框作为分隔线
            &:not(:last-child) {
              border-right: 1px solid var(--one-table-border-color);
            }
          }

          &:last-child td {
            border-bottom: none;

            &:first-child {
              border-bottom-left-radius: 7px;
            }

            &:last-child {
              border-bottom-right-radius: 7px;
            }
          }
        }
      }
    }

    th,
    td {
      max-width: 400px;
      padding: 8px 12px;
      border: 1px solid var(--one-table-border-color);
      white-space: normal;
      text-align: left;
      background-color: transparent;
    }
  }
}

@keyframes typewriter {
  0% {
    opacity: 1;
  }
  50% {
      opacity: 0;
  }
  100% {
      opacity: 1;
  }
}

</style>
