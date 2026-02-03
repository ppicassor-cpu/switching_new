// FILE: src/screens/AdRemovePlanScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ RevenueCat 실제 API 키 적용
const API_KEY = 'goog_mDVeLhnrmBdCHYOwgQyNSOMejqH';

// 프리미엄 상태 저장 키
const PREMIUM_CACHE_KEY = 'SWITCHING_IS_PREMIUM';

// RevenueCat 대시보드에 설정된 Entitlement 이름 (대소문자 정확해야 함)
const ENTITLEMENT_ID = 'pro';

export default function AdRemovePlanScreen({ navigation }: any) {
  const [isPremium, setIsPremium] = useState(false); // 프리미엄 여부
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null); // 구매할 상품(월간 구독)
  const [isBusy, setIsBusy] = useState(false); // 로딩/결제 진행 상태
  const [isInitializing, setIsInitializing] = useState(true); // 초기화 상태

  // 🔔 커스텀 알림(Alert) 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const alertAnim = useRef(new Animated.Value(0)).current;

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

  // 뒤로가기 버튼 핸들링 (팝업이 켜져있으면 팝업만 닫기)
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

  useEffect(() => {
    let mounted = true;

    const setupRevenueCat = async () => {
      try {
        // 1. RevenueCat 초기화
        if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: API_KEY });
        }

        // 2. 현재 사용자 정보 확인 (이미 구독 중인지 체크)
        const customerInfo = await Purchases.getCustomerInfo();
        if (mounted) {
          const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
          setIsPremium(isActive);
          saveCache(isActive);
        }

        // 3. 판매할 상품 정보(Offerings) 가져오기
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.monthly && mounted) {
          // 대시보드에서 설정한 'Current' 오퍼링의 'Monthly' 패키지 로드
          setPkg(offerings.current.monthly);
        }
      } catch (e) {
        console.log('RevenueCat Setup Error:', e);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    setupRevenueCat();

    return () => { mounted = false; };
  }, []);

  // 로컬 캐시 저장 헬퍼
  const saveCache = async (active: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_CACHE_KEY, active ? '1' : '0');
    } catch {}
  };

  // 구매/구독 핸들러 (바로 신청 & 하단 버튼 공용)
  const handlePurchase = async () => {
    if (isBusy) return;
    if (isPremium) {
      showAlert('알림', '이미 프리미엄 혜택을 이용 중입니다.');
      return;
    }
    if (!pkg) {
      showAlert('알림', '상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsBusy(true);
    try {
      // 실제 결제 요청
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // 결제 성공 후 권한 확인
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        setIsPremium(true);
        saveCache(true);
        showAlert('감사합니다!', '프리미엄 구독이 시작되었습니다.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        showAlert('결제 실패', e.message || '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  // 구매 복원 핸들러
  const handleRestore = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      
      setIsPremium(isActive);
      saveCache(isActive);

      if (isActive) {
        showAlert('복원 완료', '프리미엄 혜택이 복원되었습니다.');
      } else {
        showAlert('알림', '복원할 구독 내역이 없습니다.');
      }
    } catch (e: any) {
      showAlert('오류', '구매 복원 중 문제가 발생했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  // 스토어 구독 관리 페이지 열기
  const openStoreSubscription = async () => {
    try {
      const url = Platform.OS === 'android' 
        ? 'https://play.google.com/store/account/subscriptions' 
        : 'https://apps.apple.com/account/subscriptions';
      await Linking.openURL(url);
    } catch {
      showAlert('알림', '스토어를 열 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>광고제거 플랜</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* 상단 Hero 카드 */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroTitle}>프리미엄</Text>
              <Text style={styles.heroSub}>광고 없는 쾌적한 앱 사용</Text>
            </View>
            {/* ✅ 요청하신 [바로 신청] 버튼 추가 */}
            {!isPremium && (
              <TouchableOpacity 
                style={styles.quickBuyBtn} 
                onPress={handlePurchase}
                disabled={isBusy || !pkg}
              >
                <Text style={styles.quickBuyTxt}>바로 신청</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, isPremium ? styles.badgeOn : styles.badgeOff]}>
              <Text style={[styles.badgeTxt, isPremium ? styles.badgeTxtOn : styles.badgeTxtOff]}>
                {isInitializing ? '확인 중…' : isPremium ? '현재: 프리미엄 적용 중' : '현재: 무료 버전 사용 중'}
              </Text>
            </View>
          </View>
        </View>

        {/* 혜택 목록 카드 (내용 요약 및 수정됨) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>프리미엄 혜택</Text>

          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>모든 배너 및 전면 광고 완벽 제거</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>앱 시작 및 저장 시 대기 시간 없이 즉시 실행</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>세션 제한 없는 무제한 앱 스위칭 지원</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>향후 업데이트되는 프리미엄 전용 기능 이용 가능</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>빠르고 정확한 프리미엄 전용 고객 지원</Text>
          </View>
        </View>

        {/* 하단 구매/복원 버튼 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>구독 / 관리</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePurchase}
            style={[styles.primaryBtn, (isBusy || isPremium || !pkg) && styles.btnDisabled]}
            disabled={isBusy || isPremium || !pkg}
          >
            {isBusy ? (
              <ActivityIndicator color={ACCENT} size="small" />
            ) : (
              <Text style={styles.primaryBtnTxt}>
                {isPremium 
                  ? '이미 프리미엄 혜택 중입니다' 
                  : pkg 
                    ? `${pkg.product.priceString} / 월간 구독하기` 
                    : '상품 정보 불러오는 중...'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={handleRestore} style={[styles.secondaryBtn, isBusy && styles.btnDisabled]} disabled={isBusy}>
            <Text style={styles.secondaryBtnTxt}>구매 내역 복원</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={openStoreSubscription} style={styles.linkBtn}>
            <Text style={styles.linkTxt}>스토어에서 구독 관리 열기 ↗</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            구독 해지는 구글 플레이 스토어 설정에서 언제든 가능합니다.
          </Text>
        </View>
      </ScrollView>

      {/* ✅ 커스텀 팝업 (Alert Replacement) */}
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
              <Text style={styles.alertButtonText}>확인</Text>
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    marginBottom: 14,
  },
  // Hero Header Row 추가 (타이틀과 버튼 가로 배치용)
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  heroSub: { color: SUB, fontSize: 13, marginTop: 4, lineHeight: 18 },
  
  // 새로 추가된 [바로 신청] 버튼 스타일
  quickBuyBtn: {
    backgroundColor: 'rgba(29,212,245,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  quickBuyTxt: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },

  badgeRow: { marginTop: 14, flexDirection: 'row' },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  badgeOn: { borderColor: ACCENT, backgroundColor: 'rgba(29,212,245,0.12)' },
  badgeOff: { borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)' },
  badgeTxt: { fontSize: 12, fontWeight: '800' },
  badgeTxtOn: { color: ACCENT },
  badgeTxtOff: { color: SUB },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 12,
  },
  cardTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 12 },
  lineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bullet: { color: ACCENT, fontSize: 16, fontWeight: '900', marginRight: 8, marginTop: -1 },
  lineTxt: { color: SUB, fontSize: 13, lineHeight: 18, flex: 1 },

  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,212,245,0.14)',
    borderWidth: 1,
    borderColor: ACCENT,
    marginTop: 2,
  },
  primaryBtnTxt: { color: ACCENT, fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },

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

  linkBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  linkTxt: { color: TEXT, fontSize: 12, fontWeight: '800', opacity: 0.85 },

  note: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: 'center' },

  btnDisabled: { opacity: 0.5 },

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