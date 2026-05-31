<template>
  <svg v-if="!isTextareaExpanded" class="resize-input" viewBox="0 0 1024 1024" version="1.1"
       xmlns="http://www.w3.org/2000/svg" p-id="13466" width="200" height="200">
    <path
      d="M416 560c-13.248 0-25.264 5.376-33.936 14.064L144 812.128V736a48 48 0 1 0-96 0v192a48 48 0 0 0 48 48h192a48 48 0 1 0 0-96h-76.112l238.064-238.064A48 48 0 0 0 416 560zM928 48H736a48 48 0 1 0 0 96h76.112L574.064 382.064a48 48 0 1 0 67.872 67.872L880 211.888V288a48 48 0 1 0 96 0V96a48 48 0 0 0-48-48z"
      fill="" p-id="13467" />
  </svg>
  <svg v-else class="resize-input" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
       p-id="13624" width="200" height="200">
    <path
      d="M976 96a48 48 0 0 0-81.936-33.936L656 300.112V224a48 48 0 1 0-96 0v192a48 48 0 0 0 48 48h192a48 48 0 1 0 0-96h-76.112L961.936 129.936A47.824 47.824 0 0 0 976 96zM416 560H224a48 48 0 1 0 0 96h76.112L62.064 894.064a48 48 0 1 0 67.872 67.872L368 723.888V800a48 48 0 1 0 96 0V608a48 48 0 0 0-48-48z"
      fill="" p-id="13625" />
  </svg>
</template>
<script lang='ts'>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'TextareaExpandIcon',
  props: {
    isTextareaExpanded: {
      type: Boolean,
      default: false,
    }
  }
});
</script>
