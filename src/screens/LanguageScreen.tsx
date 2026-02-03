// FILE: src/screens/LanguageScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageMode } from '../constants/translations';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageScreen({ navigation }: any) {
  const { language, changeLanguage, t } = useLanguage();
  
  const [selectedLang, setSelectedLang] = useState<LanguageMode>(language);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const alertAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  // ✅ 번역 처리 함수 (한국어일 때 한글 강제 적용)
  const tt = (key: string) => {
    // 1. 로컬 폴백 정의
    const fallback: Record<LanguageMode, Record<string, string>> = {
      ko: {
        language_change: '언어 변경',
        language_select: '언어 선택',
        lang_note: '선택한 언어는 앱 전체에 적용됩니다.',
        apply_complete: '적용 완료',
        confirm: '확인',
      },
      en: {
        language_change: 'Change Language',
        language_select: 'Select Language',
        lang_note: 'The selected language applies to the whole app.',
        apply_complete: 'Applied',
        confirm: 'OK',
      },
      ja: {
        language_change: '言語変更',
        language_select: '言語を選択',
        lang_note: '選択した言語はアプリ全体に適用されます。',
        apply_complete: '適用完了',
        confirm: '確認',
      },
      zh: {
        language_change: '语言设置',
        language_select: '选择语言',
        lang_note: '所选语言将应用于整个应用。',
        apply_complete: '已应用',
        confirm: '确定',
      },
    };

    // ✅ [수정] 한국어 모드라면 글로벌 설정(영어 스타일)을 무시하고 로컬 한글 텍스트 우선 사용
    if (language === 'ko' && fallback.ko[key]) {
      return fallback.ko[key];
    }

    // 그 외 언어는 글로벌 번역 우선
    const v = t(key as any);
    if (v !== key) return v;

    return fallback[language]?.[key] ?? key;
  };

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  useEffect(() => {
    Animated.timing(alertAnim, {
      toValue: alertVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [alertVisible]);

  useEffect(() => {
    const backAction = () => {
      if (alertVisible) {
        hideAlert();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [alertVisible]);

  const applyLang = async (next: LanguageMode) => {
    setSelectedLang(next);
    await changeLanguage(next);
    
    let msg = '';
    if (next === 'ko') msg = '한국어로 설정되었습니다.';
    else if (next === 'en') msg = 'English is selected.';
    else if (next === 'ja') msg = '日本語に設定されました。';
    else if (next === 'zh') msg = '已设置为中文。';

    showAlert(tt('apply_complete'), msg);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tt('language_change')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tt('language_select')}</Text>

          {/* 한국어 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('ko')}
            style={[styles.optionRow, selectedLang === 'ko' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>한국어</Text>
            <Text style={[styles.check, selectedLang === 'ko' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          {/* English */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('en')}
            style={[styles.optionRow, selectedLang === 'en' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>English</Text>
            <Text style={[styles.check, selectedLang === 'en' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          {/* 日本語 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('ja')}
            style={[styles.optionRow, selectedLang === 'ja' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>日本語</Text>
            <Text style={[styles.check, selectedLang === 'ja' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

           {/* 中文 */}
           <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('zh')}
            style={[styles.optionRow, selectedLang === 'zh' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>中文</Text>
            <Text style={[styles.check, selectedLang === 'zh' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {tt('lang_note')}
          </Text>
        </View>
      </ScrollView>

      <Animated.View 
        pointerEvents={alertVisible ? "auto" : "none"}
        style={[styles.alertRoot, { opacity: alertAnim }]}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={hideAlert}
              style={styles.alertButton}
            >
              <Text style={styles.alertButtonText}>{tt('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
}

const BG = '#050505';
const CARD = '#111';
const BORDER = '#222';
const TEXT = '#eaeaea';
const SUB = '#bdbdbd';
const MUTED = '#777';
const ACCENT = '#1dd4f5';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: TEXT, fontSize: 22, fontWeight: '800' },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  headerRight: { width: 44, height: 44 },

  content: { padding: 18, paddingBottom: 26 },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 12 },

  optionRow: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  optionRowOn: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(29,212,245,0.10)',
  },
  optionText: { color: SUB, fontSize: 13, fontWeight: '900' },
  check: { width: 18, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  checkOn: { color: ACCENT },
  checkOff: { color: 'transparent' },

  note: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: 'center' },

  alertRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#0f0f0f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  alertTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    color: SUB,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  alertButton: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: 'rgba(29,212,245,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  alertButtonText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
});