// 현재 런 유물 상세 모달

import { RELIC_DEFINITIONS } from '@tower-of-cardborn/game-core/data/relics';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { useLanguage, useTranslation } from '../../i18n';
import { getRelicDescription, getRelicName } from '../../i18n/relic-text';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import styles from '../../styles/app.module.css';

interface RelicViewerProps {
  readonly relics: readonly RelicId[];
  readonly onClose: () => void;
}

export function RelicViewer({ relics, onClose }: RelicViewerProps) {
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
        aria-labelledby="relic-viewer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="relic-viewer-title">{t('relics')} ({relics.length})</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <ul className={styles.relicList}>
          {relics.map((relicId) => (
            <li key={relicId} className={styles.relicListItem}>
              <span className={styles.relicIcon} aria-hidden="true">{RELIC_DEFINITIONS[relicId].emoji}</span>
              <div>
                <strong>{getRelicName(relicId, lang)}</strong>
                <p>{getRelicDescription(relicId, lang)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
