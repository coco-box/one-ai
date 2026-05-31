import { ref } from '@vue/composition-api';
import type { Attachment } from '@coco-box/ai-ui';

export function useFileUpload() {
  // 附件列表
  const attachments = ref<Attachment[]>([]);
  // 文件输入框(隐藏的)
  const fileInputRef = ref<HTMLInputElement | null>(null);

  // 处理附件
  const handleAttachment = () => {
    if (!fileInputRef.value) {
      fileInputRef.value = document.createElement('input');
      fileInputRef.value.type = 'file';
      fileInputRef.value.multiple = true;
      fileInputRef.value.accept = '*/*';
      fileInputRef.value.onchange = async (e) => {
        const { files } = (e.target as HTMLInputElement);
        if (files) {
          // eslint-disable-next-line no-restricted-syntax
          for (const file of Array.from(files)) {
            // eslint-disable-next-line no-await-in-loop
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              // eslint-disable-next-line no-shadow
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            attachments.value.push({
              name: file.name,
              contentType: file.type,
              url: dataUrl,
            });
          }
        }
      };
    }
    fileInputRef.value.click();
  };

  return {
    attachments,
    handleAttachment,
  };
}
