// FILE: src/screens/HelpScreen.tsx
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FaqItem = { q: string; a: string };

export default function HelpScreen({ navigation }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faq = useMemo<FaqItem[]>(
    () => [
      {
        q: '볼륨다운이 동작하지 않아요',
        a: '안드로이드 설정에서 “접근성 권한”이 필요합니다.\n설정 > 접근성 > 설치된 앱에서 스위칭 서비스를 “사용”으로 변경해주세요.',
      },
      {
        q: 'System Online/Offline은 무엇인가요?',
        a: 'Online은 “감지/실행 기능이 활성화된 상태”를 의미합니다.\nOffline은 기능이 꺼진 상태입니다.',
      },
      {
        q: '배터리 최적화 안내가 뜨는 이유',
        a: '백그라운드에서 안정적으로 동작하려면 배터리 최적화(절전) 제한을 해제하는 것이 도움이 됩니다.',
      },
      {
        q: '프리미엄은 무엇이 달라지나요?',
        a: '프리미엄은 광고(배너/전면) 노출이 제거되고, 더 쾌적한 사용이 가능합니다.',
      },
      {
        q: '문의는 어디로 하나요?',
        a: '아래 “이메일 문의” 버튼을 이용해주세요.',
      },
    ],
    []
  );

  const onPressEmail = async () => {
    const subject = encodeURIComponent('[Switching] 문의');
    const body = encodeURIComponent('가능하면 아래 정보를 함께 적어주세요:\n- 기기 모델\n- 안드로이드/아이폰 버전\n- 재현 방법\n- 발생 시점\n');
    const url = `mailto:ppicassor@gmail..com?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>도움말</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>자주 묻는 질문</Text>

          {faq.map((item, idx) => {
            const open = openIndex === idx;
            return (
              <View key={`${idx}-${item.q}`} style={[styles.faqItem, idx === 0 && styles.faqFirst]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setOpenIndex(open ? null : idx)}
                  style={styles.faqQRow}
                >
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <Text style={styles.faqChevron}>{open ? '－' : '＋'}</Text>
                </TouchableOpacity>
                {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>지원</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={onPressEmail} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnTxt}>이메일 문의 ↗</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>
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
    marginBottom: 12,
  },
  cardTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 12 },

  faqItem: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    marginTop: 12,
  },
  faqFirst: { borderTopWidth: 0, paddingTop: 0, marginTop: 0 },
  faqQRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { color: SUB, fontSize: 13, fontWeight: '900', flex: 1, paddingRight: 10, lineHeight: 18 },
  faqChevron: { color: ACCENT, fontSize: 18, fontWeight: '900' },
  faqA: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 10 },

  primaryBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,212,245,0.14)',
    borderWidth: 1,
    borderColor: ACCENT,
  },
  primaryBtnTxt: { color: ACCENT, fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  note: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: 'center' },
});
