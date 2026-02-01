import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import mobileAds, { AdEventType, BannerAd, BannerAdSize, InterstitialAd, MaxAdContentRating } from 'react-native-google-mobile-ads';
import * as IAP from 'react-native-iap';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { AppSwitchModule } = NativeModules;

const INTERSTITIAL_ID = 'ca-app-pub-5144004139813427/8304323709';
const BANNER_ID = 'ca-app-pub-5144004139813427/7182813723';

const AD_REQUEST_OPTIONS = {
  requestNonPersonalizedAdsOnly: true,
};

const SESSION_START_AT_KEY = 'SWITCHING_SESSION_START_AT';
const SESSION_DURATION_MS = 60 * 60 * 1000;

interface AppInfo {
  label: string;
  packageName: string;
  iconUri?: string;
}

interface AppState {
  targetPackage: string;
  isEnabled: boolean;
  isPremium: boolean;
}

const { width } = Dimensions.get('window');

export default function App() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const interstitialRef = useRef<any>(null);
  const adLoadedRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const pendingStartRef = useRef<boolean>(false);

  const [appList, setAppList] = useState<AppInfo[]>([]);
  const [targetPackage, setTargetPackage] = useState<string>('');
  const [targetLabel, setTargetLabel] = useState<string>('');
  const [targetIconUri, setTargetIconUri] = useState<string>('');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const stateRef = useRef<AppState>({ targetPackage, isEnabled, isPremium });

  const progressAnim = useRef(new Animated.Value(1)).current;
  const sessionStartAtRef = useRef<number | null>(null);
  const sessionOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logo2Opacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const logoOpacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const gaugeScaleX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    stateRef.current = { targetPackage, isEnabled, isPremium };
  }, [targetPackage, isEnabled, isPremium]);

  useEffect(() => {
    if (!targetPackage || !appList.length) return;
    const found = appList.find((a) => a.packageName === targetPackage);
    if (!found) return;
    setTargetLabel(found.label || '');
    setTargetIconUri(found.iconUri || '');
  }, [targetPackage, appList]);

  const clearSessionTimers = () => {
    if (sessionOffTimerRef.current) {
      clearTimeout(sessionOffTimerRef.current);
      sessionOffTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const getProgress = (startAt: number) => {
    const elapsed = Date.now() - startAt;
    const raw = elapsed / SESSION_DURATION_MS;
    return Math.max(0, Math.min(1, raw));
  };

  const expireSession = async (pkgOverride?: string) => {
    await AsyncStorage.removeItem(SESSION_START_AT_KEY);
    sessionStartAtRef.current = null;
    clearSessionTimers();
    progressAnim.setValue(1);

    setIsEnabled(false);
    if (AppSwitchModule?.saveSettings) {
      AppSwitchModule.saveSettings(pkgOverride ?? stateRef.current.targetPackage, false);
    }
  };

  const syncSession = async () => {
    const saved = await AsyncStorage.getItem(SESSION_START_AT_KEY);
    const startAt = saved ? Number(saved) : null;

    if (!startAt || Number.isNaN(startAt)) {
      sessionStartAtRef.current = null;
      clearSessionTimers();
      progressAnim.setValue(1);
      return null;
    }

    const elapsed = Date.now() - startAt;
    if (elapsed >= SESSION_DURATION_MS) {
      await expireSession();
      return null;
    }

    sessionStartAtRef.current = startAt;

    const p = getProgress(startAt);
    Animated.timing(progressAnim, { toValue: p, duration: 250, useNativeDriver: false }).start();

    if (sessionOffTimerRef.current) clearTimeout(sessionOffTimerRef.current);
    const remain = SESSION_DURATION_MS - (Date.now() - startAt);
    sessionOffTimerRef.current = setTimeout(() => {
      void expireSession();
    }, remain);

    if (!progressTimerRef.current) {
      progressTimerRef.current = setInterval(() => {
        const s = sessionStartAtRef.current;
        if (!s) return;
        progressAnim.setValue(getProgress(s));
      }, 1000);
    }

    return startAt;
  };

  const startNewSessionAndEnable = async (pkgOverride?: string) => {
    const now = Date.now();
    await AsyncStorage.setItem(SESSION_START_AT_KEY, String(now));
    sessionStartAtRef.current = now;

    progressAnim.setValue(0);

    setIsEnabled(true);
    if (AppSwitchModule?.saveSettings) {
      AppSwitchModule.saveSettings(pkgOverride ?? stateRef.current.targetPackage, true);
    }

    clearSessionTimers();
    sessionOffTimerRef.current = setTimeout(() => {
      void expireSession(pkgOverride ?? stateRef.current.targetPackage);
    }, SESSION_DURATION_MS);

    progressTimerRef.current = setInterval(() => {
      const s = sessionStartAtRef.current;
      if (!s) return;
      progressAnim.setValue(getProgress(s));
    }, 1000);
  };

  const requestStartWithAdGate = async () => {
    const ad = interstitialRef.current;

    if (!ad?.show || !ad?.load) {
      Alert.alert("알림", "광고를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    pendingSaveRef.current = false;
    pendingStartRef.current = true;

    if (adLoadedRef.current) {
      ad.show();
    } else {
      ad.load();
      Alert.alert("알림", "광고 로딩 중입니다. 잠시만 기다려주세요.");
    }
  };

  useEffect(() => {
    let mounted = true;

    let unsubLoaded: any = null;
    let unsubClosed: any = null;
    let unsubError: any = null;

    async function initializeApp() {
      try {
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(true);
          StatusBar.setBackgroundColor("transparent");
          NavigationBar.setBackgroundColorAsync("#000000");
          NavigationBar.setButtonStyleAsync("light");
        }

        try {
          await IAP.initConnection();
          const purchases = await IAP.getAvailablePurchases();
          const hasSub = purchases.some((p: any) => p.productId === 'monthly_sub' && p.transactionId);
          if (mounted) setIsPremium(hasSub);
        } catch (e) {
          console.warn("IAP Init Fail:", e);
        }

        try {
          await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.PG,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
          });

          await mobileAds().initialize();

          const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, AD_REQUEST_OPTIONS);
          interstitialRef.current = ad;

          unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
            adLoadedRef.current = true;
            if (mounted) setAdLoaded(true);

            if (pendingSaveRef.current && interstitialRef.current?.show) {
              interstitialRef.current.show();
            }
            if (pendingStartRef.current && interstitialRef.current?.show) {
              interstitialRef.current.show();
            }
          });

          unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            adLoadedRef.current = false;
            if (mounted) setAdLoaded(false);

            if (pendingSaveRef.current) {
              pendingSaveRef.current = false;
              saveSettings();
            }

            if (pendingStartRef.current) {
              pendingStartRef.current = false;
              void startNewSessionAndEnable();
            }

            ad.load();
          });

          unsubError = ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
            console.warn("Ad Error:", err);
            adLoadedRef.current = false;
            if (mounted) setAdLoaded(false);
            pendingSaveRef.current = false;
            pendingStartRef.current = false;
          });

          ad.load();
        } catch (e) {
          console.warn("AdMob Init Fail:", e);
        }
      } catch (err) {
        console.error("Critical Init Error:", err);
      }
    }

    initializeApp();

    if (AppSwitchModule?.getSettings) {
      AppSwitchModule.getSettings().then((res: any) => {
        if (!mounted) return;

        const pkg = res?.targetPackage || '';
        const enabled = !!res?.isEnabled;

        setTargetPackage(pkg);
        setIsEnabled(enabled);

        if (enabled) {
          syncSession().then((startAt) => {
            if (!mounted) return;

            if (startAt) {
              setIsEnabled(true);
              if (AppSwitchModule?.saveSettings) {
                AppSwitchModule.saveSettings(pkg || stateRef.current.targetPackage, true);
              }
              return;
            }

            void startNewSessionAndEnable(pkg || stateRef.current.targetPackage);
          }).catch(() => {});
        } else {
          void expireSession(pkg || stateRef.current.targetPackage);
        }
      }).catch(console.error);
    }

    if (AppSwitchModule?.getInstalledApps) {
      AppSwitchModule.getInstalledApps()
        .then((apps: AppInfo[]) => {
          if (!mounted) return;
          const sortedApps = apps.sort((a, b) => a.label.localeCompare(b.label));
          setAppList(sortedApps);
          setLoading(false);
        })
        .catch(() => { if (mounted) setLoading(false); });
    } else {
      if (mounted) setLoading(false);
    }

    const volumeListener = Platform.OS === 'android'
      ? DeviceEventEmitter.addListener('onVolumeDownTrigger', handleVolumeDownTrigger)
      : null;

    return () => {
      mounted = false;
      volumeListener?.remove();
      clearSessionTimers();
      try { unsubLoaded && unsubLoaded(); } catch {}
      try { unsubClosed && unsubClosed(); } catch {}
      try { unsubError && unsubError(); } catch {}
      try { IAP.endConnection(); } catch {}
    };
  }, []);

  async function handleVolumeDownTrigger() {
    const { targetPackage: pkg, isEnabled: enabled, isPremium: premium } = stateRef.current;

    if (!enabled || !pkg) return;

    if (premium) {
      launchTargetApp();
      return;
    }

    const lastAdTime = await AsyncStorage.getItem('last_ad_time');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastAdTime && now - parseInt(lastAdTime) < oneHour) {
      launchTargetApp();
    } else {
      if (adLoadedRef.current && interstitialRef.current?.show) {
        await AsyncStorage.setItem('last_ad_time', now.toString());
        interstitialRef.current.show();
      } else {
        launchTargetApp();
      }
    }
  }

  const launchTargetApp = () => {
    const { targetPackage: pkg } = stateRef.current;
    if (pkg && AppSwitchModule?.launchApp) {
      AppSwitchModule.launchApp(pkg);
    }
  };

  const handleSaveWithLogic = async () => {
    if (!targetPackage) {
      Alert.alert("알림", "앱을 선택해주세요.");
      return;
    }

    if (isPremium) {
      saveSettings();
      return;
    }

    const ad = interstitialRef.current;

    if (!adLoadedRef.current) {
      ad?.load();
      Alert.alert("알림", "광고를 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    pendingStartRef.current = false;
    pendingSaveRef.current = true;
    ad.show();
  };

  const saveSettings = () => {
    if (AppSwitchModule?.saveSettings) {
      AppSwitchModule.saveSettings(targetPackage, isEnabled);
      Alert.alert("저장 성공", `[${targetLabel}] 설정이 시스템에 반영되었습니다.`);
    }
  };

  const toggleEnabledByLogo = async () => {
    if (!targetPackage) {
      Alert.alert("알림", "앱을 선택해주세요.");
      return;
    }

    if (!isEnabled) {
      if (AppSwitchModule?.isAccessibilityServiceEnabled) {
        const isGranted = await AppSwitchModule.isAccessibilityServiceEnabled();
        if (!isGranted) {
          Alert.alert(
            "접근성 권한 필요",
            "볼륨 키를 감지하려면 접근성 권한이 필요합니다.\n\n[설정 이동] 후 '설치된 앱' 목록에서 [스위칭 서비스]를 '사용'으로 바꿔주세요.",
            [
              { text: "나중에", style: "cancel" },
              { text: "설정 이동", onPress: () => AppSwitchModule.openAccessibilitySettings() }
            ]
          );
          return;
        }
      }
    }

    if (isEnabled) {
      await expireSession(targetPackage);
      return;
    }

    const startAt = await syncSession();
    if (startAt) {
      setIsEnabled(true);
      if (AppSwitchModule?.saveSettings) {
        AppSwitchModule.saveSettings(targetPackage, true);
      }
      return;
    }

    if (isPremium) {
      await startNewSessionAndEnable(targetPackage);
      return;
    }

    await requestStartWithAdGate();
  };

  const renderItem = ({ item }: { item: AppInfo }) => (
    <TouchableOpacity
      style={[styles.appItem, targetPackage === item.packageName && styles.selectedItem]}
      onPress={() => {
        setTargetPackage(item.packageName);
        setTargetLabel(item.label);
        setTargetIconUri(item.iconUri || '');
        setModalVisible(false);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.iconUri && (
          <Image
            source={{ uri: item.iconUri }}
            style={{ width: 40, height: 40, marginRight: 10 }}
          />
        )}
        <View>
          <Text style={styles.appLabel}>{item.label}</Text>
          <Text style={styles.appPackage}>{item.packageName}</Text>
        </View>
      </View>
      {targetPackage === item.packageName && <Text style={styles.checkIcon}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

        <SafeAreaView pointerEvents="none" edges={['top', 'left', 'right']} style={styles.gaugeSafeArea}>
          <View style={[styles.gaugeOuter, { opacity: isEnabled ? 1 : 0 }]}>
            <Animated.View
              style={[
                styles.gaugeInner,
                {
                  transform: [
                    { translateX: -width / 2 },
                    { scaleX: gaugeScaleX as any },
                    { translateX: width / 2 },
                  ],
                },
              ]}
            />
          </View>
        </SafeAreaView>

        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.headerArea}>
            <View style={[styles.premiumBadge, isPremium ? styles.badgePremium : styles.badgeFree]}>
              <Text style={styles.premiumText}>
                {isPremium ? "💎 PREMIUM" : "FREE VERSION"}
              </Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            <TouchableOpacity
              onPress={toggleEnabledByLogo}
              activeOpacity={0.9}
              style={[styles.logoContainer, isEnabled && styles.logoGlow]}
            >
              {isEnabled ? (
                <View style={styles.logoStack}>
                  <Animated.Image
                    source={require('./assets/app-logo2.png')}
                    style={[styles.logoImage, styles.logoAbsolute, { opacity: logo2Opacity }]}
                    resizeMode="contain"
                  />
                  <Animated.Image
                    source={require('./assets/app-logo.png')}
                    style={[styles.logoImage, styles.logoAbsolute, { opacity: logoOpacity }]}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Image
                  source={require('./assets/app-logo.png')}
                  style={[styles.logoImage, { opacity: 0.4 }]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            <Text style={[styles.statusLabel, { color: isEnabled ? '#1dd4f5' : '#555' }]}>
              {isEnabled ? "System Online" : "System Offline"}
            </Text>

            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>TARGET APP</Text>
              <TouchableOpacity
                style={styles.appCard}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.cardIcon, { backgroundColor: targetIconUri ? 'transparent' : (targetLabel ? '#007AFF' : '#222') }]}>
                  {targetIconUri ? (
                    <Image
                      source={{ uri: targetIconUri }}
                      style={{ width: 38, height: 38, borderRadius: 10 }}
                    />
                  ) : (
                    <Text style={styles.cardIconText}>{targetLabel ? targetLabel.charAt(0) : '?'}</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {targetLabel || "앱 선택하기"}
                  </Text>
                  <Text style={styles.cardSubTitle} numberOfLines={1}>
                    {targetPackage || "Touch to select target"}
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.footerArea}>
              <TouchableOpacity style={styles.fabButton} onPress={handleSaveWithLogic}>
                <Text style={styles.fabIcon}>💾</Text>
                <Text style={styles.fabText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select App</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {loading ? (
                  <Text style={styles.emptyText}>Loading apps...</Text>
                ) : (
                  <FlatList
                    data={appList}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.packageName}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No apps found.</Text>}
                    indicatorStyle="white"
                  />
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>

        <SafeAreaView style={styles.adSafeArea} edges={['bottom']}>
          <View style={styles.adContainer}>
            <BannerAd
              unitId={BANNER_ID}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={AD_REQUEST_OPTIONS}
            />
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  safeArea: { flex: 1 },

  gaugeSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 50,
  },
  gaugeOuter: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gaugeInner: {
    width: '100%',
    height: 2,
    backgroundColor: '#1dd4f5',
  },

  headerArea: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android'
      ? (StatusBar.currentHeight || 20) + 5
      : 10 + 12,
    zIndex: 10
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeFree: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#333' },
  badgePremium: { backgroundColor: 'rgba(0,122,255,0.15)', borderColor: '#0052D4' },
  premiumText: { fontSize: 9, fontWeight: '800', color: '#ccc', letterSpacing: 0.5 },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30
  },
  logoContainer: {
    marginBottom: 25,
    borderRadius: 100,
  },
  logoImage: { width: 160, height: 160 },
  logoStack: { width: 160, height: 160, position: 'relative' },
  logoAbsolute: { position: 'absolute', left: 0, top: 0 },

  logoGlow: {
    shadowColor: '#dae1e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 25,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 40,
    textTransform: 'uppercase'
  },

  cardContainer: { width: '85%', maxWidth: 340 },
  cardLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  cardIconText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#eee', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardSubTitle: { color: '#555', fontSize: 11 },
  cardArrow: { paddingLeft: 10 },
  arrowText: { color: '#444', fontSize: 20 },

  footerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    zIndex: 20
  },
  fabButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 0.9,
    borderColor: '#49a0c2',
  },
  fabIcon: { display: 'none' },
  fabText: {
    color: '#c8d0d4',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },

  adSafeArea: {
    backgroundColor: '#000'
  },
  adContainer: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000'
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '85%',
    height: '65%',
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#161616'
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  closeText: { color: '#666', fontSize: 18 },
  listContent: { padding: 10 },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: '#1A1A1A'
  },
  selectedItem: { backgroundColor: '#111', borderColor: '#1dd4f5', borderWidth: 1 },
  appLabel: { fontSize: 15, fontWeight: '500', color: '#eee' },
  appPackage: { fontSize: 11, color: '#555', marginTop: 2 },
  checkIcon: { color: '#1dd4f5', fontWeight: 'bold', fontSize: 16, position: 'absolute', right: 15 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 50, fontSize: 12 },
});
