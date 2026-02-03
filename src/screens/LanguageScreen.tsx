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
import { useLanguage } from '../contexts/LanguageContext'; // ✅ Context 사용

const LANG_KEY = 'SWITCHING_LANGUAGE';

export default function LanguageScreen({ navigation }: any) {
  // ✅ Context에서 가져오기
  const { language, changeLanguage, t } = useLanguage();
  
  // 로컬 상태 (즉시 UI 반응용)
  const [selectedLang, setSelectedLang] = useState<LanguageMode>(language);

  // 🔔 커스텀 알림(Alert) 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const alertAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  // 알림 표시 함수
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // 알림 닫기 함수
  const hideAlert = () => {
    setAlertVisible(false);
  };

  // 알림 애니메이션 효과
  useEffect(() => {
    Animated.timing(alertAnim, {
      toValue: alertVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [alertVisible]);

  // 뒤로가기 버튼 핸들링
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
    
    // 메시지 내용도 선택된 언어에 맞춰서 보여줌
    let msg = '';
    if (next === 'ko') msg = '한국어로 설정되었습니다.';
    else if (next === 'en') msg = 'English is selected.';
    else if (next === 'ja') msg = '日本語に設定されました。';
    else if (next === 'zh') msg = '已设置为中文。';

    showAlert(t('apply_complete'), msg);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language_change')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('language_select')}</Text>

          {/* 한국어 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('ko')}
            style={[styles.optionRow, selectedLang === 'ko' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>{t('korean')}</Text>
            <Text style={[styles.check, selectedLang === 'ko' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          {/* English */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('en')}
            style={[styles.optionRow, selectedLang === 'en' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>{t('english')}</Text>
            <Text style={[styles.check, selectedLang === 'en' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          {/* 日本語 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('ja')}
            style={[styles.optionRow, selectedLang === 'ja' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>{t('japanese')}</Text>
            <Text style={[styles.check, selectedLang === 'ja' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

           {/* 中文 */}
           <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => applyLang('zh')}
            style={[styles.optionRow, selectedLang === 'zh' && styles.optionRowOn]}
          >
            <Text style={styles.optionText}>{t('chinese')}</Text>
            <Text style={[styles.check, selectedLang === 'zh' ? styles.checkOn : styles.checkOff]}>✓</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {t('lang_note')}
          </Text>
        </View>
      </ScrollView>

      {/* 커스텀 팝업 */}
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
              <Text style={styles.alertButtonText}>{t('confirm')}</Text>
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

  // --- 커스텀 팝업 스타일 ---
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