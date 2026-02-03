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
import { useLanguage } from '../contexts/LanguageContext';

const API_KEY = 'goog_mDVeLhnrmBdCHYOwgQyNSOMejqH';
const PREMIUM_CACHE_KEY = 'SWITCHING_IS_PREMIUM';
const ENTITLEMENT_ID = 'pro';

export default function AdRemovePlanScreen({ navigation }: any) {
  const { t } = useLanguage();

  const [isPremium, setIsPremium] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const alertAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    let mounted = true;

    const setupRevenueCat = async () => {
      try {
        if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: API_KEY });
        }

        const customerInfo = await Purchases.getCustomerInfo();
        if (mounted) {
          const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
          setIsPremium(isActive);
          saveCache(isActive);
        }

        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.monthly && mounted) {
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

  const saveCache = async (active: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_CACHE_KEY, active ? '1' : '0');
    } catch {}
  };

  const handlePurchase = async () => {
    if (isBusy) return;
    if (isPremium) {
      showAlert(t('alert'), t('already_premium'));
      return;
    }
    if (!pkg) {
      showAlert(t('alert'), t('loading'));
      return;
    }

    setIsBusy(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        setIsPremium(true);
        saveCache(true);
        showAlert(t('purchase_success'), t('purchase_success_msg'));
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        showAlert(t('error'), e.message || 'Error');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestore = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      
      setIsPremium(isActive);
      saveCache(isActive);

      if (isActive) {
        showAlert(t('restore_complete'), t('restore_complete_msg'));
      } else {
        showAlert(t('alert'), t('restore_fail_msg'));
      }
    } catch (e: any) {
      showAlert(t('error'), 'Restore Error');
    } finally {
      setIsBusy(false);
    }
  };

  const openStoreSubscription = async () => {
    try {
      const url = Platform.OS === 'android' 
        ? 'https://play.google.com/store/account/subscriptions' 
        : 'https://apps.apple.com/account/subscriptions';
      await Linking.openURL(url);
    } catch {
      showAlert(t('alert'), t('open_store_error'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ad_remove_plan')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroTitle}>{t('premium_title')}</Text>
              <Text style={styles.heroSub}>{t('premium_sub')}</Text>
            </View>
            {!isPremium && (
              <TouchableOpacity 
                style={styles.quickBuyBtn} 
                onPress={handlePurchase}
                disabled={isBusy || !pkg}
              >
                <Text style={styles.quickBuyTxt}>{t('quick_buy')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, isPremium ? styles.badgeOn : styles.badgeOff]}>
              <Text style={[styles.badgeTxt, isPremium ? styles.badgeTxtOn : styles.badgeTxtOff]}>
                {isInitializing ? t('check') : isPremium ? t('status_premium') : t('status_free')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('premium_benefits')}</Text>

          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>{t('benefit_1')}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>{t('benefit_2')}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>{t('benefit_3')}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>{t('benefit_4')}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.lineTxt}>{t('benefit_5')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('subscription_manage_section')}</Text>

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
                  ? t('already_premium') 
                  : pkg 
                    ? `${pkg.product.priceString} ${t('subscribe_monthly')}` 
                    : t('loading')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={handleRestore} style={[styles.secondaryBtn, isBusy && styles.btnDisabled]} disabled={isBusy}>
            <Text style={styles.secondaryBtnTxt}>{t('restore_purchase')}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={openStoreSubscription} style={styles.linkBtn}>
            <Text style={styles.linkTxt}>{t('open_store')}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {t('subscription_note')}
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
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  heroSub: { color: SUB, fontSize: 13, marginTop: 4, lineHeight: 18 },
  
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