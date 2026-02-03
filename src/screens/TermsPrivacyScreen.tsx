// FILE: src/screens/TermsPrivacyScreen.tsx
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

export default function TermsPrivacyScreen({ navigation }: any) {
  const { t } = useLanguage();

  const lastUpdated = '2026-02-03';
  const companyAddress = 'Gimhae City, Korea';
  const contactEmail = 'ppicassor@gmail.com';
  const privacyOfficer = '손성현';
  const privacyContact = 'ppicassor@gmail.com';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms_privacy')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('terms_summary')}</Text>
          <Text style={styles.p}>{t('terms_summary_p1')}</Text>
          <Text style={styles.p}>{t('terms_summary_p2')}</Text>
          <Text style={styles.p}>{t('terms_summary_p3')}</Text>
          <Text style={styles.meta}>최종 수정일: {lastUpdated}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('terms_section_1')}</Text>
          <Text style={styles.p}>{t('terms_sec1_p1')}</Text>
          <Text style={styles.p}>{t('terms_sec1_p2')}</Text>
          <Text style={styles.p}>{t('terms_sec1_p3')}</Text>

          <Text style={styles.title}>{t('terms_section_2')}</Text>
          <Text style={styles.p}>{t('terms_sec2_p1')}</Text>
          <Text style={styles.p}>{t('terms_sec2_p2')}</Text>
          <Text style={styles.p}>{t('terms_sec2_p3')}</Text>
          <Text style={styles.p}>{t('terms_sec2_p4')}</Text>
          <Text style={styles.p}>{t('terms_sec2_p5')}</Text>

          <Text style={styles.title}>{t('terms_section_3')}</Text>
          <Text style={styles.p}>{t('terms_sec3_p1')}</Text>
          <Text style={styles.p}>{t('terms_sec3_p2')}</Text>
          <Text style={styles.p}>{t('terms_sec3_p3')}</Text>
          <Text style={styles.p}>{t('terms_sec3_p4')}</Text>

          <Text style={styles.title}>{t('terms_section_4')}</Text>
          <Text style={styles.p}>{t('terms_sec4_p1')}</Text>
          <Text style={styles.p}>{t('terms_sec4_p2')}</Text>
          <Text style={styles.p}>{t('terms_sec4_p3')}</Text>
          <Text style={styles.p}>{t('terms_sec4_p4')}</Text>
          <Text style={styles.p}>{t('terms_sec4_p5')}</Text>

          <Text style={styles.title}>{t('terms_section_5')}</Text>
          <Text style={styles.p}>- 성명: {privacyOfficer}</Text>
          <Text style={styles.p}>- 연락처: {privacyContact}</Text>
          <Text style={styles.p}>- 주소: {companyAddress}</Text>

          <Text style={styles.title}>{t('terms_section_6')}</Text>
          <Text style={styles.p}>{t('terms_sec6_p1')}</Text>
          <Text style={styles.p}>{t('terms_sec6_p2')}</Text>

          <Text style={styles.title}>{t('terms_section_7')}</Text>
          <Text style={styles.p}>- 개인정보/약관 관련 문의: {contactEmail}</Text>
          <Text style={styles.p}>- 기타 앱 관련 문의: {contactEmail}</Text>
          <Text style={styles.note}>{t('terms_note')}</Text>
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
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },
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
  title: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 10 },
  p: { color: SUB, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  meta: { color: MUTED, fontSize: 11, marginTop: 6 },
  note: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 10 },
});