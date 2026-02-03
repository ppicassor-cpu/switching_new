// FILE: src/contexts/LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageMode, STRINGS } from '../constants/translations';

const LANG_KEY = 'SWITCHING_LANGUAGE';

type LanguageContextType = {
  language: LanguageMode;
  changeLanguage: (mode: LanguageMode) => Promise<void>;
  t: (key: string) => string;
};

// 1. Context 생성
const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  changeLanguage: async () => {},
  t: (key: string) => key,
});

// 2. Provider (공급 장치) 컴포넌트
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<LanguageMode>('ko');

  // 앱 켜질 때 저장된 언어 불러오기
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        // ✅ 4개 국어(ko, en, ja, zh) 모두 체크
        if (saved === 'ko' || saved === 'en' || saved === 'ja' || saved === 'zh') {
          setLanguage(saved as LanguageMode);
        }
      } catch {}
    })();
  }, []);

  // 언어 변경 함수
  const changeLanguage = async (mode: LanguageMode) => {
    setLanguage(mode);
    try {
      await AsyncStorage.setItem(LANG_KEY, mode);
    } catch {}
  };

  // 번역 헬퍼 함수 (t)
  const t = (key: string) => {
    const currentStrings = STRINGS[language];
    const text = (currentStrings as any)[key];
    const koText = (STRINGS.ko as any)[key];
    return text || koText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 3. 쉽게 쓰기 위한 커스텀 Hook
export const useLanguage = () => useContext(LanguageContext);