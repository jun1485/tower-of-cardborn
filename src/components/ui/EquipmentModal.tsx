// 영구 장비 강화 모달 (강화석 소비)

import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import {
  EQUIPMENT_SLOTS, MAX_EQUIPMENT_LEVEL,
  getSlotEffectValue, getUpgradeCost, loadEquipment, upgradeEquipment,
} from '../../utils/equipment';
import type { EquipmentSlot } from '../../utils/equipment';
import { playSfx } from '../../utils/sound';
import styles from '../../styles/app.module.css';

interface EquipmentModalProps {
  readonly onClose: () => void;
}

/** 슬롯별 아이콘/번역 키 */
const SLOT_META: Record<EquipmentSlot, {
  readonly icon: string;
  readonly nameKey: 'equipWeapon' | 'equipArmor' | 'equipAccessory' | 'equipBoots' | 'equipRing' | 'equipTalisman';
  readonly effectKey: 'equipWeaponEffect' | 'equipArmorEffect' | 'equipAccessoryEffect'
    | 'equipBootsEffect' | 'equipRingEffect' | 'equipTalismanEffect';
}> = {
  weapon: { icon: '⚔️', nameKey: 'equipWeapon', effectKey: 'equipWeaponEffect' },
  armor: { icon: '🛡️', nameKey: 'equipArmor', effectKey: 'equipArmorEffect' },
  accessory: { icon: '📿', nameKey: 'equipAccessory', effectKey: 'equipAccessoryEffect' },
  boots: { icon: '🥾', nameKey: 'equipBoots', effectKey: 'equipBootsEffect' },
  ring: { icon: '💍', nameKey: 'equipRing', effectKey: 'equipRingEffect' },
  talisman: { icon: '🧿', nameKey: 'equipTalisman', effectKey: 'equipTalismanEffect' },
};

export function EquipmentModal({ onClose }: EquipmentModalProps) {
  const t = useTranslation();
  const modalRef = useModalKeyboard(onClose);
  const [equipment, setEquipment] = useState(loadEquipment);
  const [saveFailed, setSaveFailed] = useState(false);

  /** 슬롯 강화 실행 */
  const handleUpgrade = (slot: EquipmentSlot) => {
    const result = upgradeEquipment(slot);
    if (!result.upgraded) return;
    if (!result.saved) {
      setSaveFailed(true);
      return;
    }
    setSaveFailed(false);
    playSfx('upgrade');
    setEquipment(result.state);
  };

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="equipment-title">{t('equipment')}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <div className={styles.policyContent}>
          {saveFailed && <p className={styles.resetWarning} role="alert">{t('settingsSaveError')}</p>}
          <p className={styles.shardBadge}>💠 {t('shards')} {equipment.shards.toLocaleString()}</p>
          <ul className={styles.equipList}>
            {EQUIPMENT_SLOTS.map((slot) => {
              const level = equipment.levels[slot];
              const cost = getUpgradeCost(level);
              const meta = SLOT_META[slot];
              return (
                <li key={slot} className={styles.equipSlot}>
                  <span className={styles.equipIcon} aria-hidden="true">{meta.icon}</span>
                  <div className={styles.equipInfo}>
                    <strong className={styles.equipName}>
                      {t(meta.nameKey)} <span className={styles.equipLevel}>Lv.{level}/{MAX_EQUIPMENT_LEVEL}</span>
                    </strong>
                    <span className={styles.equipEffect}>
                      {t(meta.effectKey, getSlotEffectValue(slot, level))}
                      {cost !== null && ` → ${t(meta.effectKey, getSlotEffectValue(slot, level + 1))}`}
                    </span>
                  </div>
                  <button
                    className={styles.equipUpgradeBtn}
                    disabled={cost === null || equipment.shards < cost}
                    onClick={() => handleUpgrade(slot)}
                  >
                    {cost === null ? t('equipMaxLevel') : t('equipUpgradeCost', cost)}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={styles.equipNote}>{t('equipDailyNote')}</p>
        </div>
      </div>
    </div>
  );
}
