<template>
  <span class="one-bubble-avatar-wrapper">
    <img
      v-if="imgSrc && !isErrorImg"
      :src="imgSrc"
      alt=""
      @error="() => (isErrorImg = true)"
      :style="{
        height: `${height}px`,
        width: `${width}px`,
        borderRadius: isRound ? '100%' : '0',
      }"
    />
    <span
      v-if="!imgSrc && !isNobody && nameDisplay && nameDisplay.length !== 0"
      :class="['one-bubble-avatar-style', `one-bubble-avatar-background-${code}`]"
      :style="{
        height: `${height}px`,
        width: `${width}px`,
        lineHeight: `${height}px`,
        fontSize: `${fontSize}px`,
        borderRadius: isRound ? '100%' : '0',
      }"
    >
      {{ nameDisplay }}
    </span>
    <span
      v-if="!imgSrc && !isNobody && nameDisplay && nameDisplay.length === 0"
      class="one-bubble-avatar-style"
      :style="{ borderRadius: isRound ? '100%' : '0' }"
    >
      <AvatarBodyIcon :width="width" :height="height" />
    </span>
    <span
      v-if="(!imgSrc && isNobody) || (imgSrc && isErrorImg)"
      class="one-bubble-avatar-style"
      :style="{ borderRadius: isRound ? '100%' : '0' }"
    >
      <AvatarNoBodyIcon :width="width" :height="height" />
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import AvatarBodyIcon from './AvatarBodyIcon.vue';
import AvatarNoBodyIcon from './AvatarNoBodyIcon.vue';
import { avatarProps, AvatarProps } from './avatar-types';

export default defineComponent({
  name: 'OneBubbleAvatar',
  props: avatarProps,
  components: {
    AvatarBodyIcon,
    AvatarNoBodyIcon,
  },
  setup(props: AvatarProps) {
    const isErrorImg = ref(false);
    const isNobody = ref(true);
    const code = ref(1);
    const fontSize = ref(12);
    const nameDisplay = ref<string>();

    const getBackgroundColor = (char: string): void => {
      if (props.gender) {
        if (props.gender.toLowerCase() === 'male') {
          code.value = 1;
        } else if (props.gender.toLowerCase() === 'female') {
          code.value = 0;
        }
        return;
      }
      const unicode = char.charCodeAt(0);
      code.value = unicode % 2;
    };

    const setDisplayName = (nameValue: string, widthValue: number): void => {
      if (nameValue.length < 2) {
        nameDisplay.value = nameValue;
      } else {
        // 以中文开头显示最后两个字符
        // eslint-disable-next-line no-lonely-if
        if (/^[\u4e00-\u9fa5]/.test(nameValue)) {
          nameDisplay.value = nameValue.substr(nameValue.length - 2, 2);
          // 英文开头
        } else if (/^[A-Za-z]/.test(nameValue)) {
          if (/[_ -]/.test(nameValue)) {
            // 含有两个及以上，包含空格，下划线，中划线分隔符的英文名取前两个字母的首字母
            const [first = '', second = ''] = nameValue.split(/[_\-\s]+/);
            nameDisplay.value = first.charAt(0).toUpperCase() + second.charAt(0).toUpperCase();
          } else {
            // 一个英文名的情况显示前两个字母
            nameDisplay.value = nameValue.substr(0, 2).toUpperCase();
          }
        } else {
          // 非中英文开头默认取前两个字符
          nameDisplay.value = nameValue.substr(0, 2);
        }
      }
      if (widthValue < 30) {
        nameDisplay.value = nameValue.substr(0, 1).toUpperCase();
      }
      getBackgroundColor(nameValue.substr(0, 1));
    };

    const calcValues = (nameInput: string): void => {
      const userName = nameInput;
      const minNum = Math.min(props.width, props.height);
      if (userName) {
        isNobody.value = false;
        setDisplayName(userName, minNum);
      } else if (userName === '') {
        isNobody.value = false;
        nameDisplay.value = '';
      } else {
        isNobody.value = true;
      }
      fontSize.value = minNum / 4 + 3;
    };

    // 初始化
    calcValues(props.name);

    watch(
      () => [props.name, props.width, props.height, props.gender],
      () => {
        calcValues(props.name);
      },
      { immediate: true, deep: false }
    );

    return {
      isErrorImg,
      isNobody,
      code,
      fontSize,
      nameDisplay,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-bubble-avatar-wrapper {
  display: inline-block;

  .one-bubble-avatar-style {
    display: inline-block;
    text-align: center;
    color: var(--one-light-text);
  }

  .one-bubble-avatar-background-0 {
    background-color: #ff8b87;
  }

  .one-bubble-avatar-background-1 {
    background-color: #7693f5;
  }
}
</style>