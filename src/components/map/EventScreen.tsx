// 이벤트 화면: 선택지 제시 + 결과 표시

import type { EventId, EventResult } from '@tower-of-cardborn/game-core/types/event';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { getEventById } from '@tower-of-cardborn/game-core/data/events';
import { hasUnownedRelic, isRelicId } from '@tower-of-cardborn/game-core/data/relics';
import { isChoiceAvailable } from '@tower-of-cardborn/game-core/game/event-engine';
import { canUpgrade } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getEventText } from '../../i18n/event-text';
import { getCardName } from '../../i18n/card-text';
import { getRelicName } from '../../i18n/relic-text';
import type { Language } from '../../i18n/types';
import styles from '../../styles/app.module.css';

interface EventScreenProps {
  readonly eventId: EventId;
  readonly eventResult: EventResult | null;
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly gold: number;
  readonly deck: readonly string[];
  readonly relics: readonly RelicId[];
  readonly onChoose: (choiceIndex: number) => void;
  readonly onFinish: () => void;
}

/** 결과 인자 카드/유물 토큰 → 이름 번역 치환 */
function formatResultArg(arg: string | number, lang: Language): string | number {
  if (typeof arg === 'string' && arg.startsWith('card:')) {
    return getCardName(arg.slice(5), lang);
  }
  if (typeof arg === 'string' && arg.startsWith('relic:')) {
    const relicId = arg.slice(6);
    return isRelicId(relicId) ? getRelicName(relicId, lang) : relicId;
  }
  return arg;
}

export function EventScreen({
  eventId,
  eventResult,
  playerHp,
  playerMaxHp,
  gold,
  deck,
  relics,
  onChoose,
  onFinish,
}: EventScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const event = getEventById(eventId);
  if (!event) return null;

  const choiceContext = {
    hp: playerHp,
    maxHp: playerMaxHp,
    gold,
    deckSize: deck.length,
    upgradableCount: deck.filter((id) => canUpgrade(id)).length,
    relicCandidateAvailable: hasUnownedRelic(relics),
  };

  return (
    <div className={styles.resultScreen}>
      <span className={styles.eventEmoji}>{event.emoji}</span>
      <h1 className={styles.eventTitle}>{getEventText(`${event.id}.title`, lang)}</h1>
      <p className={styles.eventBody}>{getEventText(`${event.id}.body`, lang)}</p>
      <span className={styles.goldBadge}>❤️ {playerHp}/{playerMaxHp} · 💰 {gold}</span>

      {!eventResult ? (
        <div className={styles.eventChoices}>
          {event.choices.map((choice, index) => (
            <button
              key={index}
              className={styles.eventChoiceBtn}
              disabled={!isChoiceAvailable(choice, choiceContext)}
              onClick={() => onChoose(index)}
            >
              {getEventText(`${event.id}.c${index + 1}`, lang, ...choice.labelArgs)}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className={styles.eventResultText}>
            {getEventText(eventResult.key, lang, ...eventResult.args.map((arg) => formatResultArg(arg, lang)))}
          </p>
          <button className={styles.resultBtn} onClick={onFinish}>
            {t('eventContinue')}
          </button>
        </>
      )}
    </div>
  );
}
