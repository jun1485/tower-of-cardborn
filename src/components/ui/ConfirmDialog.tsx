// 범용 확인 다이얼로그 (overlay 클릭 시 취소)

import { useTranslation } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import styles from '../../styles/app.module.css';

interface ConfirmDialogProps {
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslation();
  const modalRef = useModalKeyboard(onCancel);

  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div
        className={styles.confirmModal}
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-message" className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.confirmBtn} onClick={onConfirm}>{confirmText ?? t('confirm')}</button>
          <button className={styles.cancelBtn} onClick={onCancel}>{cancelText ?? t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}
