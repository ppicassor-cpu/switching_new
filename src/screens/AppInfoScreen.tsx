// FILE: src/screens/AppInfoScreen.tsx
import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppInfoScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>앱정보</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{appName}</Text>
          <Text style={styles.heroSub}>Version {version}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>

          <View style={styles.row}>
            <Text style={styles.label}>버전</Text>
            <Text style={styles.value} numberOfLines={1}>{version}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>빌드 번호</Text>
            <Text style={styles.value} numberOfLines={1}>{buildNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>SDK 버전</Text>
            <Text style={styles.value} numberOfLines={1}>{sdkVersion}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Android 패키지</Text>
            <Text style={styles.value} numberOfLines={1}>{androidPackage}</Text>
          </View>

          <Text style={styles.note}>
            표시 정보는 Expo 설정(expoConfig) 기준입니다. (환경에 따라 일부 값이 비어 있을 수 있습니다)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>개발자 정보</Text>

          <View style={styles.row}>
            <Text style={styles.label}>개발자</Text>
            <Text style={styles.value} numberOfLines={1}>{developer}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>연락처</Text>
            <Text style={styles.value} numberOfLines={1}>{contactEmail}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>웹사이트</Text>
            <Text style={styles.value} numberOfLines={1}>{website}</Text>
          </View>

          <Text style={styles.note}>
            앱 관련 문의나 피드백은 이메일로 보내주세요. 빠른 시일 내에 답변드리겠습니다.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>앱 설명</Text>
          <Text style={styles.description}>
            Switching 앱은 볼륨 다운 버튼으로 빠르게 앱을 전환할 수 있는 혁신적인 도구입니다. 
            접근성 서비스를 활용하여 백그라운드에서 동작하며, 무료 버전과 프리미엄 플랜을 제공합니다. 
            배터리 최적화 해제와 접근성 권한이 필요하며, 세션 기반으로 동작하여 안정성을 보장합니다.
          </Text>
          <Text style={styles.description}>
            주요 기능:
            - 볼륨 다운 버튼으로 타겟 앱 즉시 실행
            - 설치된 앱 목록 표시 및 선택
            - 프리미엄 플랜으로 광고 제거
            - 세션 타이머와 프로그레스 바
          </Text>
          <Text style={styles.note}>
            앱을 더 잘 활용하기 위해 도움말을 확인하세요.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>바로가기</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('TermsPrivacy')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnTxt}>약관 및 개인정보처리지침 보기 ›</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Help')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnTxt}>도움말 열기 ›</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SubscriptionManage')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnTxt}>구독 관리 ›</Text>
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