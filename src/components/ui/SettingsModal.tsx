// 게임 설정 모달 (볼륨, 종료 확인, 언어 선택, 세이브 초기화)

import { useCallback, useState } from 'react';
import type { GameSettings } from '../../utils/settings';
import { loadSettings, saveSettings, resetSettings } from '../../utils/settings';
import { clearSave } from '../../utils/storage';
import { useTranslation, LANGUAGES, LANGUAGE_LABELS } from '../../i18n';
import type { Language } from '../../i18n';
import styles from '../../styles/app.module.css';

interface SettingsModalProps {
  readonly onClose: () => void;
  readonly onLangChange: (lang: Language) => void;
}

export function SettingsModal({ onClose, onLangChange }: SettingsModalProps) {
  const t = useTranslation();
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 설정값 변경 후 즉시 저장
  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  /** 언어 변경 시 settings 저장 + 상위 컴포넌트 알림 */
  const handleLangChange = useCallback((lang: Language) => {
    updateSetting('language', lang);
    onLangChange(lang);
  }, [updateSetting, onLangChange]);

  // 세이브 데이터 초기화
  const handleResetSave = useCallback(() => {
    clearSave();
    setShowResetConfirm(false);
  }, []);

  // 설정 초기화
  const handleResetSettings = useCallback(() => {
    resetSettings();
    const fresh = loadSettings();
    setSettings(fresh);
    onLangChange(fresh.language);
  }, [onLangChange]);

  return (
    <div className={styles.settingsOverlay} onClick={onClose}>
      <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.settingsHeader}>
          <h2>{t('settings')}</h2>
          <button className={styles.policyCloseBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.settingsContent}>
          {/* 언어 선택 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel}>{t('language')}</label>
            <div className={styles.langGroup}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  className={`${styles.langBtn} ${settings.language === lang ? styles.langBtnActive : ''}`}
                  onClick={() => handleLangChange(lang)}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* BGM 볼륨 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel}>{t('bgmVolume')}</label>
            <div className={styles.sliderGroup}>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.bgmVolume}
                className={styles.slider}
                onChange={(e) => updateSetting('bgmVolume', Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{settings.bgmVolume}</span>
            </div>
          </div>

          {/* 효과음 볼륨 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel}>{t('sfxVolume')}</label>
            <div className={styles.sliderGroup}>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.sfxVolume}
                className={styles.slider}
                onChange={(e) => updateSetting('sfxVolume', Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{settings.sfxVolume}</span>
            </div>
          </div>

          {/* 종료 확인 토글 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel}>{t('confirmOnExit')}</label>
            <button
              className={`${styles.toggle} ${settings.confirmOnExit ? styles.toggleOn : ''}`}
              onClick={() => updateSetting('confirmOnExit', !settings.confirmOnExit)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.settingsDivider} />

          {/* 세이브 초기화 */}
          {!showResetConfirm ? (
            <button className={styles.dangerBtn} onClick={() => setShowResetConfirm(true)}>
              {t('resetSave')}
            </button>
          ) : (
            <div className={styles.resetConfirmGroup}>
              <p className={styles.resetWarning}>{t('resetSaveWarning')}</p>
              <div className={styles.resetActions}>
                <button className={styles.dangerBtn} onClick={handleResetSave}>{t('deleteSave')}</button>
                <button className={styles.cancelBtn} onClick={() => setShowResetConfirm(false)}>{t('cancel')}</button>
              </div>
            </div>
          )}

          {/* 설정 초기화 */}
          <button className={styles.resetSettingsBtn} onClick={handleResetSettings}>
            {t('resetSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
