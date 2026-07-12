// 현재 런 포션 상세 모달

import { POTION_DEFINITIONS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { useLanguage, useTranslation } from '../../i18n';
import { getPotionDescription, getPotionName } from '../../i18n/potion-text';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import styles from '../../styles/app.module.css';

interface PotionViewerProps {
  readonly potions: readonly PotionId[];
  readonly onClose: () => void;
}

export function PotionViewer({ potions, onClose }: PotionViewerProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="potion-viewer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="potion-viewer-title">{t('potions')} ({potions.length})</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <ul className={styles.relicList}>
          {potions.map((potionId, index) => (
            <li key={`${potionId}-${index}`} className={styles.relicListItem}>
              <span className={styles.potionIcon} aria-hidden="true">{POTION_DEFINITIONS[potionId].emoji}</span>
              <div>
                <strong>{getPotionName(potionId, lang)}</strong>
                <p>{getPotionDescription(potionId, lang)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
