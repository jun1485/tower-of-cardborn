// 다국어 컨텍스트 및 훅

import { createContext, useContext } from 'react';
import type { Language, Translations } from './types';
import { ko } from './ko';
import { en } from './en';
import { zh } from './zh';

const translationMap: Record<Language, Translations> = { ko, en, zh };

// 언어별 표시 라벨
export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
};

export const LANGUAGES: Language[] = ['ko', 'en', 'zh'];

// 번역 함수 생성 ({0}, {1} 등 플레이스홀더 치환)
function createT(lang: Language) {
  const dict = translationMap[lang];
  return (key: keyof Translations, ...args: (string | number)[]): string => {
    let text = dict[key];
    for (let i = 0; i < args.length; i++) {
      text = text.replaceAll(`{${i}}`, String(args[i]));
    }
    return text;
  };
}

export type TFunction = ReturnType<typeof createT>;

const I18nContext = createContext<TFunction>(createT('ko'));
const LangContext = createContext<Language>('ko');

export const I18nProvider = I18nContext.Provider;
export const LangProvider = LangContext.Provider;

// 번역 함수 훅
export function useTranslation(): TFunction {
  return useContext(I18nContext);
}

// 현재 언어 반환 훅
export function useLanguage(): Language {
  return useContext(LangContext);
}

export { createT };
export type { Language };
