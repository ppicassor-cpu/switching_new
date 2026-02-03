// FILE: src/screens/SubscriptionManageScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import * as IAP from 'react-native-iap';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

const MONTHLY_SUB_SKU = 'monthly_sub';

export default function SubscriptionManageScreen({ navigation }: any) {
  const { t } = useLanguage();

  const [isChecking, setIsChecking] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const refreshEntitlement = useCallback(async () => {
    try {
      const purchases = await IAP.getAvailablePurchases();
      const hasSub = purchases.some((p: any) => p?.productId === MONTHLY_SUB_SKU && p?.transactionId);
      setIsPremium(!!hasSub);
    } catch {
      setIsPremium(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await IAP.initConnection();
        if (mounted) await refreshEntitlement();
      } catch {
        if (mounted) setIsChecking(false);
      }
    })();

    return () => {
      mounted = false;
      try {
        IAP.endConnection();
      } catch {}
    };
  }, [refreshEntitlement]);

  const openStoreSubscription = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      } else {
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      }
    } catch {
      showAlert(t('alert'), t('open_store_error'));
    }
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await refreshEntitlement();
      showAlert(t('check_complete'), isPremium ? t('check_premium_msg') : t('check_free_msg'));
    } catch {
      showAlert(t('alert'), t('check_fail_msg'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subscription_manage')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('current_status')}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{t('membership')}</Text>
            <View style={[styles.pill, isPremium ? styles.pillOn : styles.pillOff]}>
              <Text style={[styles.pillTxt, isPremium ? styles.pillTxtOn : styles.pillTxtOff]}>
                {isChecking ? t('check') : isPremium ? t('premium_label') : t('free_label')}
              </Text>
            </View>
          </View>

          <Text style={styles.desc}>
            {t('sub_manage_desc')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('manage_section')}</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={openStoreSubscription} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnTxt}>{t('open_store')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onRestore}
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            disabled={busy}
          >
            <Text style={styles.secondaryBtnTxt}>{busy ? t('check') : t('check_history_again')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdRemovePlan')}
            style={styles.linkBtn}
          >
            <Text style={styles.linkTxt}>{t('go_to_ad_remove')}</Text>
          </TouchableOpacity>
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

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: SUB, fontSize: 13, fontWeight: '800' },

  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  pillOn: { borderColor: ACCENT, backgroundColor: 'rgba(29,212,245,0.12)' },
  pillOff: { borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)' },
  pillTxt: { fontSize: 12, fontWeight: '900' },
  pillTxtOn: { color: ACCENT },
  pillTxtOff: { color: SUB },

  desc: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 12 },

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

  linkBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  linkTxt: { color: TEXT, fontSize: 12, fontWeight: '800', opacity: 0.85 },

  btnDisabled: { opacity: 0.55 },

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