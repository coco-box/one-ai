// composables/useVoiceChat.ts
import { ref } from '@vue/composition-api';
import { useWarningMessage } from '@/utils/notify';

export function useVoiceChat(options: {
  maxDuration?: number, // 录音最长秒数，默认 60s
  onText?: (text: string) => void // 语音识别后回调
}) {
  const isRecording = ref(false); // 是否正在录音
  const tooltipVisible = ref(false); // 是否显示 el-tooltip
  const tooltipControlled = ref(false); // 是否完全交由 JS 控制
  const tooltipContent = ref('语音输入');
  const mediaRecorder = ref<MediaRecorder | null>(null);
  const chunks: BlobPart[] = [];

  const handleVoiceBtnHover = (show: boolean) => {
    if (!tooltipControlled.value) {
      tooltipVisible.value = show;
    }
  };

  const toggleRecording = () => {
    isRecording.value = !isRecording.value;

    if (isRecording.value) {
      tooltipControlled.value = true;
      tooltipVisible.value = true;
      tooltipContent.value = '正在录音...';

      setTimeout(() => {
        tooltipVisible.value = false;
        tooltipControlled.value = false; // 恢复 hover 控制
      }, 3000);
    } else {
      tooltipVisible.value = false;
      tooltipControlled.value = false;
    }
  };

  // NOTE: 非 HTTPS 环境无法使用录音功能
  const startRecording = async () => {
    if (isRecording.value) return;

    // 1. 检测 API 支持情况
    const hasModernAPI = !!navigator.mediaDevices?.getUserMedia;
    const legacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (!hasModernAPI && !legacyGetUserMedia) {
      useWarningMessage('您的浏览器不支持麦克风访问，请更换为最新版 Chrome、Firefox 或 Edge');
      return;
    }

    // 2. 统一封装 getUserMedia
    const getMedia = (constraints: MediaStreamConstraints) => {
      if (navigator.mediaDevices?.getUserMedia) {
        // 现代 API (仅 HTTPS/localhost 可用)
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      if (legacyGetUserMedia) {
        // 旧版 API (可在 HTTP 下工作，但兼容性差)
        return new Promise<MediaStream>((resolve, reject) =>
          legacyGetUserMedia.call(navigator, constraints, resolve, reject)
        );
      }
      return Promise.reject(new Error('getUserMedia not supported'));
    };

    try {
      const stream = await getMedia({ audio: true });

      if (!window.MediaRecorder) {
        useWarningMessage('当前浏览器不支持 MediaRecorder，请升级浏览器');
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorder.value = recorder;
      chunks.length = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          await recognizeAndSend(blob);
        } catch (err) {
          console.error('语音数据发送失败:', err);
          useWarningMessage('语音数据发送失败，请稍后重试');
        }
      };

      recorder.start();
      toggleRecording();

      // 自动停止
      setTimeout(() => stopRecording(), (options.maxDuration || 60) * 1000);
    } catch (err: any) {
      console.error('录音失败:', err);
      if (err?.name === 'NotAllowedError') {
        useWarningMessage('请允许麦克风权限');
      } else if (err?.name === 'NotFoundError') {
        useWarningMessage('未找到麦克风设备');
      } else {
        useWarningMessage('录音功能不可用，请检查浏览器设置或更换浏览器');
      }
    }
  };

  const stopRecording = () => {
    if (!isRecording.value || !mediaRecorder.value) return;
    mediaRecorder.value.stop();
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    tooltipContent.value = '语音输入';
    toggleRecording();
  };

  const recognizeAndSend = async (audioBlob: Blob) => {
    // TODO: 替换为你接入的语音识别 API
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.webm');

    try {
      const res = await fetch('/api/voice-to-text', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const text = data.text || '';
      if (text && options.onText) {
        options.onText(text);
      }
    } catch (err) {
      console.error('语音识别失败', err);
    }
  };

  return {
    isRecording,
    handleVoiceBtnHover,
    toggleRecording,
    startRecording,
    stopRecording,
    tooltipVisible,
    tooltipContent,
  };
}
