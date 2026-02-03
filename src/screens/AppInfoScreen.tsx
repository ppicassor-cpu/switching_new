// FILE: src/screens/AppInfoScreen.tsx
import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

export default function AppInfoScreen({ navigation }: any) {
  const { t } = useLanguage();

  const appName = (Constants.expoConfig as any)?.name ?? 'Switching';
  const version = (Constants.expoConfig as any)?.version ?? '-';
  const androidPackage = (Constants.expoConfig as any)?.android?.package ?? '-';
  const buildNumber = Constants.nativeBuildVersion ?? '12';
  const sdkVersion = Constants.expoVersion ?? '54.0.33';
  const developer = '손씨네 Dev Team';
  const contactEmail = 'ppicassor@gmail.com';
  const website = 'http://www.comspc.co.kr';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('app_info')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{appName}</Text>
          <Text style={styles.heroSub}>Version {version}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('basic_info')}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>{t('version')}</Text>
            <Text style={styles.value} numberOfLines={1}>{version}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('build_number')}</Text>
            <Text style={styles.value} numberOfLines={1}>{buildNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('sdk_version')}</Text>
            <Text style={styles.value} numberOfLines={1}>{sdkVersion}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('android_package')}</Text>
            <Text style={styles.value} numberOfLines={1}>{androidPackage}</Text>
          </View>

          <Text style={styles.note}>
            {t('expo_config_note')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dev_info')}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>{t('developer')}</Text>
            <Text style={styles.value} numberOfLines={1}>{developer}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('contact')}</Text>
            <Text style={styles.value} numberOfLines={1}>{contactEmail}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('website')}</Text>
            <Text style={styles.value} numberOfLines={1}>{website}</Text>
          </View>

          <Text style={styles.note}>
            {t('contact_note')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app_desc_title')}</Text>
          <Text style={styles.description}>
            {t('app_desc_1')}
          </Text>
          <Text style={styles.description}>
            {t('app_desc_2')}
          </Text>
          <Text style={styles.note}>
            {t('app_desc_note')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('shortcuts')}</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('TermsPrivacy')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnTxt}>{t('view_terms')}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Help')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnTxt}>{t('open_help')}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SubscriptionManage')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnTxt}>{t('manage_sub_link')}</Text>
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

  heroCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  heroTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  heroSub: { color: SUB, fontSize: 12, marginTop: 8, opacity: 0.9 },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  cardTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 12 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 100, color: SUB, fontSize: 12, fontWeight: '900' },
  value: { flex: 1, color: TEXT, fontSize: 12, fontWeight: '800', opacity: 0.9 },

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

  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
  },
  secondaryBtnTxt: { color: SUB, fontSize: 13, fontWeight: '800' },

  note: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 10 },

  description: { color: SUB, fontSize: 13, lineHeight: 20, marginBottom: 12 },
});