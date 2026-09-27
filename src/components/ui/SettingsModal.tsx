// 게임 설정 모달 (볼륨, 종료 확인, 언어 선택, 세이브 초기화)

import { useCallback, useState } from 'react';
import type { GameSettings } from '../../utils/settings';
import { loadSettings, saveSettings, resetSettings } from '../../utils/settings';
import { useTranslation, LANGUAGES, LANGUAGE_LABELS } from '../../i18n';
import type { Language } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import { applyMotionSetting } from '../../hooks/use-reduced-motion';
import { playSfx, refreshMusicVolume, refreshSfxVolume } from '../../utils/sound';
import styles from '../../styles/app.module.css';

interface SettingsModalProps {
  readonly onClose: () => void;
  readonly onLangChange: (lang: Language) => void;
  readonly onResetSave: () => void;
  readonly onQuitRun?: () => void;
  readonly onOpenDeck?: () => void;
  readonly onOpenRelics?: () => void;
  readonly onOpenPotions?: () => void;
}

export function SettingsModal({ onClose, onLangChange, onResetSave, onQuitRun, onOpenDeck, onOpenRelics, onOpenPotions }: SettingsModalProps) {
  const t = useTranslation();
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const modalRef = useModalKeyboard(onClose);

  // 설정값 변경 후 즉시 저장
  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaveFailed(!saveSettings(next));
  }, [settings]);

  /** 언어 변경 시 settings 저장 + 상위 컴포넌트 알림 */
  const handleLangChange = useCallback((lang: Language) => {
    playSfx('button_click');
    updateSetting('language', lang);
    onLangChange(lang);
  }, [updateSetting, onLangChange]);

  /** 배경음악 볼륨 즉시 반영 */
  const handleMusicVolumeChange = useCallback((volume: number) => {
    updateSetting('musicVolume', volume);
    refreshMusicVolume(volume);
  }, [updateSetting]);

  // 세이브 데이터 초기화
  const handleResetSave = useCallback(() => {
    onResetSave();
    setShowResetConfirm(false);
    onClose();
  }, [onClose, onResetSave]);

  /** 진행 중 런 포기 후 타이틀 복귀 */
  const handleQuitRun = useCallback(() => {
    onQuitRun?.();
    setShowQuitConfirm(false);
    onClose();
  }, [onClose, onQuitRun]);

  /** 설정 종료 후 현재 덱 열기 */
  const handleOpenDeck = useCallback(() => {
    onClose();
    onOpenDeck?.();
  }, [onClose, onOpenDeck]);

  /** 설정 종료 후 현재 유물 열기 */
  const handleOpenRelics = useCallback(() => {
    onClose();
    onOpenRelics?.();
  }, [onClose, onOpenRelics]);

  /** 설정 종료 후 현재 포션 열기 */
  const handleOpenPotions = useCallback(() => {
    onClose();
    onOpenPotions?.();
  }, [onClose, onOpenPotions]);

  // 설정 초기화
  const handleResetSettings = useCallback(() => {
    playSfx('button_click');
    if (!resetSettings()) {
      setSaveFailed(true);
      return;
    }
    const fresh = loadSettings();
    setSettings(fresh);
    setSaveFailed(false);
    onLangChange(fresh.language);
    refreshMusicVolume(fresh.musicVolume);
    refreshSfxVolume(fresh.sfxVolume);
    applyMotionSetting(fresh.reduceMotion);
  }, [onLangChange]);

  return (
    <div className={styles.settingsOverlay} onClick={onClose}>
      <div
        className={styles.settingsModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.settingsHeader}>
          <h2 id="settings-title">{t('settings')}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.settingsContent}>
          {saveFailed && <p className={styles.resetWarning} role="alert">{t('settingsSaveError')}</p>}
          {/* 언어 선택 */}
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel} id="settings-language-label">{t('language')}</span>
            <div className={styles.langGroup} role="group" aria-labelledby="settings-language-label">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  className={`${styles.langBtn} ${settings.language === lang ? styles.langBtnActive : ''}`}
                  aria-pressed={settings.language === lang}
                  onClick={() => handleLangChange(lang)}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* 배경음악 볼륨 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel} htmlFor="music-volume">{t('musicVolume')}</label>
            <div className={styles.sliderGroup}>
              <input
                type="range"
                id="music-volume"
                min={0}
                max={100}
                value={settings.musicVolume}
                className={styles.slider}
                onChange={(event) => handleMusicVolumeChange(Number(event.target.value))}
              />
              <span className={styles.sliderValue}>{settings.musicVolume}</span>
            </div>
          </div>

          {/* 효과음 볼륨 */}
          <div className={styles.settingsRow}>
            <label className={styles.settingsLabel} htmlFor="sfx-volume">{t('sfxVolume')}</label>
            <div className={styles.sliderGroup}>
              <input
                type="range"
                id="sfx-volume"
                min={0}
                max={100}
                value={settings.sfxVolume}
                className={styles.slider}
                onChange={(e) => {
                  updateSetting('sfxVolume', Number(e.target.value));
                  refreshSfxVolume(Number(e.target.value));
                }}
                onPointerUp={() => playSfx('reward_pick')}
                onKeyUp={(event) => {
                  if (event.key.startsWith('Arrow')) playSfx('reward_pick');
                }}
              />
              <span className={styles.sliderValue}>{settings.sfxVolume}</span>
            </div>
          </div>

          {/* 종료 확인 토글 */}
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel} id="settings-confirm-exit-label">{t('confirmOnExit')}</span>
            <button
              className={`${styles.toggle} ${settings.confirmOnExit ? styles.toggleOn : ''}`}
              aria-pressed={settings.confirmOnExit}
              aria-labelledby="settings-confirm-exit-label"
              onClick={() => {
                playSfx('button_click');
                updateSetting('confirmOnExit', !settings.confirmOnExit);
              }}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {/* 모션 줄이기 토글 */}
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel} id="settings-reduce-motion-label">{t('reduceMotion')}</span>
            <button
              className={`${styles.toggle} ${settings.reduceMotion ? styles.toggleOn : ''}`}
              aria-pressed={settings.reduceMotion}
              aria-labelledby="settings-reduce-motion-label"
              onClick={() => {
                playSfx('button_click');
                updateSetting('reduceMotion', !settings.reduceMotion);
                applyMotionSetting(!settings.reduceMotion);
              }}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.settingsDivider} />

          {onOpenDeck && (
            <button className={styles.resetSettingsBtn} onClick={handleOpenDeck}>
              {t('deck')}
            </button>
          )}
          {onOpenRelics && (
            <button className={styles.resetSettingsBtn} onClick={handleOpenRelics}>
              {t('relics')}
            </button>
          )}
          {onOpenPotions && (
            <button className={styles.resetSettingsBtn} onClick={handleOpenPotions}>
              {t('potions')}
            </button>
          )}

          {onQuitRun && (!showQuitConfirm ? (
            <button
              className={styles.dangerBtn}
              onClick={() => {
                playSfx('button_click');
                setShowResetConfirm(false);
                setShowQuitConfirm(true);
              }}
            >
              {t('titleBack')}
            </button>
          ) : (
            <div className={styles.resetConfirmGroup}>
              <p className={styles.resetWarning}>{t('backToTitleConfirm')}</p>
              <div className={styles.resetActions}>
                <button className={styles.dangerBtn} onClick={handleQuitRun}>{t('confirm')}</button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    playSfx('button_click');
                    setShowQuitConfirm(false);
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ))}

          {/* 세이브 초기화 */}
          {!showResetConfirm ? (
            <button
              className={styles.dangerBtn}
              onClick={() => {
                playSfx('button_click');
                setShowQuitConfirm(false);
                setShowResetConfirm(true);
              }}
            >
              {t('resetSave')}
            </button>
          ) : (
            <div className={styles.resetConfirmGroup}>
              <p className={styles.resetWarning}>{t('resetSaveWarning')}</p>
              <div className={styles.resetActions}>
                <button className={styles.dangerBtn} onClick={handleResetSave}>{t('deleteSave')}</button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    playSfx('button_click');
                    setShowResetConfirm(false);
                  }}
                >
                  {t('cancel')}
                </button>
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
