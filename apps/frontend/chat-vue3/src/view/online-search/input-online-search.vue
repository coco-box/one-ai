<template>
  <d-popover :content="$t('underDevelop')" trigger="hover" :position="['top']" style="color: var(--devui-text)">
    <div class="input-online-search-container" :class="{ 'active': checked }" @click="checked = !checked">
      <i class="icon-point"></i>
      <span>{{ $t("onlineSearch") }}</span>
    </div>
  </d-popover>
</template>

<script setup lang="ts">
const checked = ref(false);
</script>

<style scoped lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.input-online-search-container {
  display: flex;
  align-items: center;
  gap: 4px;
  color: devui.$devui-text;
  cursor: pointer;
  border-radius: 24px;
  padding: 4px 8px;
  background-color: devui.$devui-disabled-bg;
  min-width: 85px;
  height: 30px;

  &:hover {
    color: devui.$devui-brand;
    background-color: var(--devui-list-item-active-bg);
  }

  span {
    font-size: devui.$devui-font-size-sm;
  }
}

.active {
  color: $devui-brand;
  background-color: var(--devui-list-item-active-bg);
}
</style>
