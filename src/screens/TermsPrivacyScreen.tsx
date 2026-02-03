// FILE: src/screens/TermsPrivacyScreen.tsx
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsPrivacyScreen({ navigation }: any) {
  const lastUpdated = '2026-02-03';
  const companyName = '손씨네 Inc.';
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
        <Text style={styles.headerTitle}>약관 및 개인정보처리지침</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.title}>요약</Text>
          <Text style={styles.p}>- 본 문서는 {companyName}가 제공하는 Switching 앱의 이용 약관과 개인정보 처리방침을 설명합니다. 앱을 사용함으로써 본 약관에 동의하는 것으로 간주됩니다.</Text>
          <Text style={styles.p}>- 당사는 사용자의 개인정보를 최소한으로 수집하며, 보호를 위해 최선의 노력을 다합니다. 자세한 내용은 아래를 참조하세요.</Text>
          <Text style={styles.p}>- 본 약관은 법적 변화나 서비스 업데이트에 따라 변경될 수 있으며, 변경 시 앱 내 공지나 이메일을 통해 알려드립니다.</Text>
          <Text style={styles.meta}>최종 수정일: {lastUpdated}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>1. 서비스 제공</Text>
          <Text style={styles.p}>
            {companyName}는 Switching 앱을 통해 사용자가 볼륨 다운 버튼으로 선택한 타겟 앱을 빠르게 실행할 수 있는 기능을 제공합니다. 
            이 기능은 접근성 서비스를 활용하며, 무료 버전(광고 포함)과 프리미엄 플랜(광고 제거, 무제한 세션)을 지원합니다.
          </Text>
          <Text style={styles.p}>
            서비스의 주요 구성 요소:
            - 타겟 앱 선택 및 저장
            - 시스템 온라인/오프라인 상태 관리
            - 세션 기반 타이머와 프로그레스 표시
            - 구독 관리 및 광고 표시
          </Text>
          <Text style={styles.p}>
            앱은 Android 기기에서 최적화되어 있으며, 배터리 최적화 해제와 접근성 권한이 필요합니다. 
            서비스 이용 시 발생하는 데이터 비용은 사용자 부담입니다.
          </Text>

          <Text style={styles.title}>2. 수집 및 처리되는 개인정보</Text>
          <Text style={styles.p}>- 앱 내 설정값: 타겟 앱의 패키지명, 기능 활성화 여부(isEnabled), 세션 시작 시각. 이는 기기 내 SharedPreferences 또는 AsyncStorage에 저장되어 앱 기능 제공에 사용됩니다.</Text>
          <Text style={styles.p}>- 구독 및 구매 정보: Google Play 스토어를 통해 구독 상태를 확인하며, 구매 영수증 ID와 제품 ID를 처리합니다. 이는 프리미엄 기능 활성화에 필요합니다.</Text>
          <Text style={styles.p}>- 광고 관련 정보: Google Mobile Ads SDK를 통해 광고 ID, 기기 정보(모델, OS 버전), IP 주소 등을 수집할 수 있습니다. 이는 광고 타겟팅 및 표시를 위해 사용되며, SDK의 개인정보 처리방침을 따릅니다.</Text>
          <Text style={styles.p}>- 로그 데이터: 앱 충돌이나 오류 발생 시 익명화된 로그를 수집하여 서비스 개선에 활용할 수 있습니다. (선택적이며, 사용자 동의 하에 진행)</Text>
          <Text style={styles.p}>당사는 법적 요구가 없는 한 사용자의 개인정보를 제3자와 공유하지 않습니다. 다만, 광고 SDK나 결제 처리 시 필요한 범위 내에서 공유될 수 있습니다.</Text>

          <Text style={styles.title}>3. 개인정보 보관 및 보호</Text>
          <Text style={styles.p}>- 보관 기간: 설정값은 앱 삭제 시까지 기기 내에 저장됩니다. 구독 정보는 구독 기간 동안 유지되며, 해지 후 즉시 삭제됩니다. 로그 데이터는 최대 90일 보관 후 삭제합니다.</Text>
          <Text style={styles.p}>- 보호 조치: 데이터는 암호화되어 저장되며, 접근 제어를 통해 무단 액세스를 방지합니다. 서버 측 데이터(없을 경우 생략)는 SSL/TLS 프로토콜을 사용합니다.</Text>
          <Text style={styles.p}>- 파기 방법: 보관 기간 종료 시 자동 삭제되며, 복구 불가능한 방법(예: overwrite)으로 처리합니다.</Text>
          <Text style={styles.p}>당사는 개인정보 보호법을 준수하며, 보안 사고 발생 시 즉시 사용자에게 통보하고 대응합니다.</Text>

          <Text style={styles.title}>4. 이용자 권리 및 행사 방법</Text>
          <Text style={styles.p}>- 열람/정정/삭제 권리: 사용자는 언제든지 자신의 개인정보를 열람, 정정, 삭제할 수 있습니다. 앱 내 설정에서 직접 관리하거나, 문의 메일을 통해 요청하세요.</Text>
          <Text style={styles.p}>- 동의 철회: 개인정보 수집 동의를 철회할 수 있으며, 철회 시 일부 기능이 제한될 수 있습니다.</Text>
          <Text style={styles.p}>- 앱 삭제: 앱을 삭제하면 기기 내 모든 설정값이 제거됩니다.</Text>
          <Text style={styles.p}>- 구독 해지: Google Play 스토어에서 구독을 관리하세요. 해지 시 프리미엄 혜택이 즉시 종료됩니다.</Text>
          <Text style={styles.p}>권리 행사 시 본인 확인 절차를 거칩니다. 처리 결과는 10일 이내에 통보드립니다.</Text>

          <Text style={styles.title}>5. 개인정보 보호책임자</Text>
          <Text style={styles.p}>- 성명: {privacyOfficer}</Text>
          <Text style={styles.p}>- 연락처: {privacyContact}</Text>
          <Text style={styles.p}>- 주소: {companyAddress}</Text>

          <Text style={styles.title}>6. 기타</Text>
          <Text style={styles.p}>- 본 약관은 한국법에 따라 해석되며, 분쟁 시 부산지방법원을 관할법원으로 합니다.</Text>
          <Text style={styles.p}>- 서비스 이용 중 발생하는 분쟁은 상호 협의를 통해 해결하며, 합의되지 않을 경우 법적 절차를 따릅니다.</Text>

          <Text style={styles.title}>7. 문의</Text>
          <Text style={styles.p}>- 개인정보/약관 관련 문의: {contactEmail}</Text>
          <Text style={styles.p}>- 기타 앱 관련 문의: {contactEmail}</Text>
          <Text style={styles.note}>문의 시 앱 버전과 기기 정보를 포함해 주시면 더 빠른 도움을 드릴 수 있습니다.</Text>
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