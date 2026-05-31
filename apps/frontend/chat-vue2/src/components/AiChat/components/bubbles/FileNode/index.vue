<template>
  <div class="file-node-grid">
    <div
      class="file-card"
      v-for="file in files"
      :key="file.id"
    >
      <div class="file-icon">
        <!-- 这里用静态图片或 iconfont，示例用 emoji -->
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="40" height="40" viewBox="0 0 40 40"><defs><clipPath id="master_svg0_30_32056/30_31753"><rect x="0" y="0" width="40" height="40" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_30_32056/30_31753)"><g><path d="M36.999501171875,8.44L29.489501171875,0.44C29.211601171875,0.160131,28.834001171875,0.00190121,28.439501171875,0L4.439541171875,0C3.5722551718749997,0.0271799,2.891478271875,0.752745,2.919538318875,1.62L2.919538318875,38.38C2.891477371875,39.2473,3.5722551718749997,39.9728,4.439541171875,40L35.999501171875,40C36.866801171875,39.9728,37.547601171875,39.2473,37.519501171875,38.38L37.519501171875,9.59C37.503301171875,9.1534,37.316601171875,8.74055,36.999501171875,8.44Z" fill="#4150FF" fill-opacity="1" /></g><g><path d="M13.64099,30L16.575870000000002,30L16.57581,29.9998L16.57624,29.9998L20.0003,19.27968L23.4242,29.9995L23.4241,30L26.3593,30L26.3591,29.9995L31.2499,12.5L28.3165,12.5L24.7938,25.1003L21.467,14.687570000000001L21.4672,14.68689L18.53376,14.68689L18.53369,14.68711L18.53339,14.68711L18.533540000000002,14.687570000000001L15.20638,25.101399999999998L11.68347,12.5L8.75,12.5L13.64099,30Z" fill-rule="evenodd" fill="#FFFFFF" fill-opacity="1" style="mix-blend-mode:passthrough" /></g></g></svg>
      </div>
      <div class="file-info">
        <div class="file-name" :title="file.name">{{ file.name }}</div>
        <div class="file-desc">文字 · 4.14 kb</div>
      </div>
      <div class="file-actions">
        <span class="action-btn" @click="onPreview($event, file)">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="20" height="20" viewBox="0 0 20 20"><defs><clipPath id="master_svg0_30_32050/30_31741"><rect x="0" y="0" width="20" height="20" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_30_32050/30_31741)"><g><g><path d="M8.99996,14.124897111816406C6.82536,14.124897111816406,5.0625,12.362037111816406,5.0625,10.187437111816406C5.0625,8.012837111816406,6.82536,6.249977111816406,8.99996,6.249977111816406C11.17456,6.249977111816406,12.93742,8.012837111816406,12.93742,10.187437111816406C12.93742,12.362037111816406,11.17456,14.124897111816406,8.99996,14.124897111816406ZM8.99996,12.999907111816405C10.55325,12.999907111816405,11.812429999999999,11.740727111816406,11.812429999999999,10.187437111816406C11.812429999999999,8.634157111816407,10.55325,7.374967111816407,8.99996,7.374967111816407C7.446680000000001,7.374967111816407,6.18749,8.634157111816407,6.18749,10.187437111816406C6.18749,11.740727111816406,7.446680000000001,12.999907111816405,8.99996,12.999907111816405Z" fill="#333303" fill-opacity="1" style="mix-blend-mode:passthrough" /></g><g><path d="M9,16.3749C5.68185,16.3749,2.70963,14.3932,0.0957136,10.50131C-0.0319045,10.31152,-0.0319045,10.06336,0.0957136,9.87357C2.70963,5.98111,5.68128,4,9,4C12.3182,4,15.2904,5.98167,17.9043,9.87357C18.0319,10.06336,18.0319,10.31152,17.9043,10.50131C15.2904,14.3938,12.3187,16.3749,9,16.3749ZM9,15.2499C11.8097,15.2499,14.3915,13.58378,16.7562,10.187439999999999C14.3915,6.7911,11.8097,5.12499,9,5.12499C6.19034,5.12499,3.60849,6.7911,1.24377,10.187439999999999C3.60849,13.58378,6.19034,15.2499,9,15.2499Z" fill="#333303" fill-opacity="1" style="mix-blend-mode:passthrough" /></g></g></g></svg>
        </span>
        <span class="action-btn" @click="onDownload($event, file)">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="20" height="20" viewBox="0 0 20 20"><defs><clipPath id="master_svg0_30_32045/30_31737"><rect x="0" y="0" width="20" height="20" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_30_32045/30_31737)"><g><path d="M17.93553125,9.152344C17.56833125,9.152344,17.271531250000002,9.449219,17.271531250000002,9.816406L17.271531250000002,15.863285000000001C17.271531250000002,15.992185,16.99023125,16.228515,16.52933125,16.228515L3.71484125,16.228515C3.2558612499999997,16.228515,2.97265125,15.992185,2.97265125,15.863285000000001L2.97265125,9.492187C2.97265125,9.125,2.67578125,8.828125,2.30859325,8.828125C1.94140625,8.828125,1.64453125,9.125,1.64453125,9.492187L1.64453125,15.865235C1.64453125,16.349605,1.89453125,16.810545,2.3281252500000003,17.128905C2.70703125,17.406245,3.19922125,17.558595,3.71484125,17.558595L16.52933125,17.558595C17.044931249999998,17.558595,17.53713125,17.406245,17.91603125,17.128905C18.34963125,16.810545,18.59963125,16.349605,18.59963125,15.865235L18.59963125,9.816406C18.59963125,9.451172,18.30073125,9.152344,17.93553125,9.152344Z" fill="#3D3D3D" fill-opacity="1" style="mix-blend-mode:passthrough" /></g><g><path d="M8.79688890625,13.269546875C9.14453890625,13.621046875,9.60742890625,13.816446875,10.101578906250001,13.818346875L10.111338906250001,13.818346875C10.60156890625,13.818346875,11.06446890625,13.628946875,11.41211890625,13.283246875L14.42774890625,10.298826875C14.68750890625,10.041016875,14.69141890625,9.621096875,14.43164890625,9.359376874999999C14.17383890625,9.099606875,13.75391890625,9.095706875000001,13.49219890625,9.355466875000001L10.767588906250001,12.052736875C10.77930890625,12.001956875,10.78711890625,11.949216875,10.78711890625,11.894526875L10.78711890625,2.912108875C10.78711890625,2.544921875,10.490248906249999,2.248046875,10.12305890625,2.248046875C9.75586890625,2.248046875,9.45899890625,2.544921875,9.45899890625,2.912108875L9.45899890625,11.894526875C9.45899890625,11.957026875,9.46875890625,12.017576875,9.48438890625,12.076166875L6.75586890625,9.318356875C6.49805790625,9.058596875,6.07813590625,9.054686875,5.81641690625,9.314456875000001C5.55665180625,9.572266875,5.55274530625,9.992186875,5.81251090625,10.253906875L8.79688890625,13.269546875Z" fill="#3D3D3D" fill-opacity="1" style="mix-blend-mode:passthrough" /></g></g></svg>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'FileNode',
  props: {
    files: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { emit }) {
    // 预览事件
    const onPreview = (event: any, file: any) => {
      event.stopPropagation();
      event.preventDefault();

      // eslint-disable-next-line no-unused-expressions
      emit('preview', file);
    };

    // 下载事件
    const onDownload = (event: any, file: any) => {
      event.stopPropagation();
      event.preventDefault();
      // eslint-disable-next-line no-unused-expressions
      emit('download', file);
    };

    return {
      onPreview,
      onDownload,
    };
  },
});
</script>

<style lang="scss" scoped>
.file-node-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 20px;
}

.file-card {
  display: flex;
  align-items: center;
  background: #F3F4F4;
  border-radius: 8px;
  padding: 12px;
  min-width: 0;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #f3f6fd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 24px;
  color: #4150ff;
  flex-shrink: 0;
  .icon-word {
    font-weight: bold;
    font-size: 22px;
    font-family: 'Arial', sans-serif;
  }
}

.file-info {
  flex: 1 1 0%;
  min-width: 0;
  .file-name {
    font-size: 15px;
    color: #31312f;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .file-desc {
    font-size: 12px;
    color: #b0b3bb;
  }
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  .action-btn {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: color 0.2s;
    &:hover {
      color: #4150ff;
    }
  }
}
</style>
