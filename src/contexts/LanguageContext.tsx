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
        // ✅ 4개 국어(ko, en, ja, zh) 모두 체크하도록 조건 업데이트
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
  // 사용법: t('home') -> 현재 언어에 맞는 번역된 문자열 반환
  const t = (key: string) => {
    // 1. 현재 언어 팩 가져오기 (ko/en/ja/zh)
    const currentStrings = STRINGS[language];
    
    // 2. 해당 키에 맞는 문구 찾기
    const text = (currentStrings as any)[key];

    // 3. 문구가 없으면 키 그대로 반환 (에러 방지용)
    return text || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 3. 쉽게 쓰기 위한 커스텀 Hook
export const useLanguage = () => useContext(LanguageContext);