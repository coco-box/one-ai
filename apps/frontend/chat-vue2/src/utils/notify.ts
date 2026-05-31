import { Message, MessageBox, Notification } from 'element-ui';

export const useMessage = Message;
export const useInfoMessage = Message.info;
export const useSuccessMessage = Message.success;
export const useErrorMessage = Message.error;
export const useWarningMessage = Message.warning;

export const useConfirm = MessageBox;
export const useAlert = MessageBox.alert;
/** 警告类确认框 */
export const useWarningConfirm = (message, title?, options = {}) =>
  MessageBox.confirm(message, title || '提示', {
    type: 'warning',
    closeOnClickModal: false,
    closeOnPressEscape: false,
    confirmButtonType: 'danger',
    ...options
  });
export const usePromptConfirm = MessageBox.prompt;
export const closeConfirm = MessageBox.close;

export const useNotification = Notification;
export const useSuccessNotification = Notification.success;
export const useInfoNotification = Notification.info;
export const useWaringNotification = Notification.warning;
export const useErrorNotification = Notification.error;
