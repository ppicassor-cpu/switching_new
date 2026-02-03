import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  Linking,
  LogBox,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import 'react-native-gesture-handler';
import mobileAds, { AdEventType, BannerAd, BannerAdSize, InterstitialAd, MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import * as IAP from 'react-native-iap';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import AdRemovePlanScreen from './src/screens/AdRemovePlanScreen';
import AppInfoScreen from './src/screens/AppInfoScreen';
import HelpScreen from './src/screens/HelpScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import SubscriptionManageScreen from './src/screens/SubscriptionManageScreen';
import TermsPrivacyScreen from './src/screens/TermsPrivacyScreen';
const { AppSwitchModule } = NativeModules;

const Stack = createNativeStackNavigator();

const INTERSTITIAL_ID = 'ca-app-pub-5144004139813427/8304323709';
const BANNER_ID = 'ca-app-pub-5144004139813427/7182813723';
const INTERSTITIAL_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : INTERSTITIAL_ID;
const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : BANNER_ID;

const AD_REQUEST_OPTIONS = {
  requestNonPersonalizedAdsOnly: true,
};

const SESSION_START_AT_KEY = 'SWITCHING_SESSION_START_AT';
const SESSION_DURATION_MS = 60 * 60 * 1000;
const BATTERY_OPT_PROMPTED_KEY = 'SWITCHING_BATTERY_OPT_PROMPTED';
// ✅ [추가] 프리미엄 상태 확인용 키
const PREMIUM_CACHE_KEY = 'SWITCHING_IS_PREMIUM';

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

type AlertBtnStyle = 'default' | 'cancel' | 'destructive';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertBtnStyle;
}

const { width } = Dimensions.get('window');
const SIDE_MENU_WIDTH = Math.min(width * 0.78, 320);

if (__DEV__) {
  LogBox.ignoreLogs([
    '`setBackgroundColorAsync` is not supported with edge-to-edge enabled.',
    'The app is running using the Legacy Architecture.',
  ]);
}

const NAV_BG = '#050505';
const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: NAV_BG,
    card: NAV_BG,
    border: NAV_BG,
    primary: '#1dd4f5',
    notification: '#1dd4f5',
    text: '#ffffff',
  },
};

function HomeScreen({ navigation }: any) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const interstitialRef = useRef<any>(null);
  const adLoadedRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const pendingStartRef = useRef<boolean>(false);
  const adGateInFlightRef = useRef<boolean>(false);
  const batteryBypassOnceRef = useRef<boolean>(false);

  const resetAdGateState = () => {
    pendingSaveRef.current = false;
    pendingStartRef.current = false;
    adGateInFlightRef.current = false;
  };

  const [appList, setAppList] = useState<AppInfo[]>([]);
  const [targetPackage, setTargetPackage] = useState<string>('');
  const [targetLabel, setTargetLabel] = useState<string>('');
  const [targetIconUri, setTargetIconUri] = useState<string>('');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[]>([{ text: '확인' }]);

  const stateRef = useRef<AppState>({ targetPackage, isEnabled, isPremium });

  const progressAnim = useRef(new Animated.Value(1)).current;
  const sessionStartAtRef = useRef<number | null>(null);
  const sessionOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [overlayActive, setOverlayActive] = useState(false);

  const sideMenuAnim = useRef(new Animated.Value(0)).current;
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [sideMenuActive, setSideMenuActive] = useState(false);
  

  const alertAnim = useRef(new Animated.Value(0)).current;
  const [alertActive, setAlertActive] = useState(false);

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

  const sideMenuTranslateX = sideMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDE_MENU_WIDTH, 0],
    extrapolate: 'clamp',
  });

  const showAlert = (title: string, message?: string, buttons?: CustomAlertButton[]) => {
    setAlertTitle(title || '');
    setAlertMessage(message || '');
    const b = buttons && buttons.length ? buttons : [{ text: '확인' }];
    setAlertButtons(b);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const pendingNavRef = useRef<{ name: string; params?: any } | null>(null);

  const forceCloseTransientUI = () => {
    pendingNavRef.current = null;

    setSideMenuVisible(false);
    setSideMenuActive(false);
    sideMenuAnim.stopAnimation();
    sideMenuAnim.setValue(0);

    setModalVisible(false);
    setOverlayActive(false);
    overlayAnim.stopAnimation();
    overlayAnim.setValue(0);

    setAlertVisible(false);
    setAlertActive(false);
    alertAnim.stopAnimation();
    alertAnim.setValue(0);
  };

  // ✅ [수정] 화면 포커스 시 프리미엄 상태 즉시 확인 (홈 화면 갱신용)
  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      forceCloseTransientUI();
      checkPremiumStatus();
    });
    const unsubBlur = navigation.addListener('blur', () => {
      forceCloseTransientUI();
    });
    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [navigation]);

  // ✅ [추가] 프리미엄 상태 체크 함수
  const checkPremiumStatus = async () => {
    try {
      const cached = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
      if (cached === '1') {
        setIsPremium(true);
        // 프리미엄이면 타이머 초기화 (무제한)
        clearSessionTimers();
        progressAnim.setValue(0); // 로고 상태 고정
      } else {
        // 캐시가 없으면 IAP 재확인 (안전장치)
        const purchases = await IAP.getAvailablePurchases();
        const hasSub = purchases.some((p: any) => p.productId === 'monthly_sub' && p.transactionId);
        setIsPremium(hasSub);
        if (hasSub) {
            clearSessionTimers();
            progressAnim.setValue(0);
        }
      }
    } catch {}
  };

  const openSideMenu = () => setSideMenuVisible(true);
  const closeSideMenu = () => setSideMenuVisible(false);

  const requestNavigate = (name: string, params?: any) => {
    pendingNavRef.current = { name, params };
    setSideMenuVisible(false);
  };


  const pressAlertButton = (btn: CustomAlertButton) => {
    setAlertVisible(false);
    try {
      btn.onPress && btn.onPress();
    } catch {}
  };

  const openBatteryOptimizationSettings = async () => {
    if (Platform.OS !== 'android') return;
    try {
      if (AppSwitchModule?.openBatteryOptimizationSettings) {
        await AppSwitchModule.openBatteryOptimizationSettings();
        return;
      }
    } catch {}
    try {
      await Linking.openSettings();
    } catch {}
  };

  const ensureBatteryOptimizationIgnored = async () => {
    if (Platform.OS !== 'android') return true;

    // 1. [최우선] 실제 시스템 설정값을 먼저 확인합니다.
    let isSystemIgnored = false;
    try {
      if (AppSwitchModule?.isBatteryOptimizationIgnored) {
        isSystemIgnored = await AppSwitchModule.isBatteryOptimizationIgnored();
      }
    } catch {}

    // ✅ 이미 '제한 없음' 상태라면 바로 통과
    if (isSystemIgnored === true) return true;

    // 2. 시스템 설정이 안 되어 있다면, 사용자가 '다시 보지 않기'를 눌렀는지 확인합니다.
    const prompted = await AsyncStorage.getItem(BATTERY_OPT_PROMPTED_KEY);
    if (prompted === '1') {
      return true;
    }

    // 3. (설정 안 됨) AND (알림 끄지 않음) 상태일 때만 팝업을 띄웁니다.
    resetAdGateState();
    showAlert(
      "배터리 최적화 해제 권장",
      "백그라운드에서 앱이 꺼지지 않으려면 배터리 설정을 '제한 없음'으로 변경해야 합니다.\n\n변경하지 않아도 실행은 되지만, 도중에 멈출 수 있습니다.",
      [
        {
          text: "다시 보지 않기",
          style: "cancel",
          onPress: () => {
            // ✅ "이제 그만 물어봐"라고 저장
            void AsyncStorage.setItem(BATTERY_OPT_PROMPTED_KEY, '1');
            
            // ✅ 방금 누른 건 즉시 실행되도록 처리
            batteryBypassOnceRef.current = true;
            setTimeout(() => { void toggleEnabledByLogo(); }, 0);
          }
        },
        {
          text: "설정 이동",
          onPress: () => {
            void openBatteryOptimizationSettings();
          }
        }
      ]
    );
    return false;
  };

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

  useEffect(() => {
    if (modalVisible) {
      setOverlayActive(true);
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setOverlayActive(false);
      });
    }
  }, [modalVisible, overlayAnim]);

  useEffect(() => {
    if (alertVisible) {
      setAlertActive(true);
      Animated.timing(alertAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(alertAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setAlertActive(false);
      });
    }
  }, [alertVisible, alertAnim]);

  useEffect(() => {
    if (sideMenuVisible) {
      setSideMenuActive(true);
      Animated.timing(sideMenuAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(sideMenuAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          setSideMenuActive(false);
          const next = pendingNavRef.current;
          if (next) {
            pendingNavRef.current = null;
            navigation.navigate(next.name, next.params);
          }
        }
      });
    }
  }, [sideMenuVisible, sideMenuAnim, navigation]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sideMenuActive) {
        setSideMenuVisible(false);
        return true;
      }
      if (alertActive) {
        hideAlert();
        return true;
      }
      if (overlayActive) {
        setModalVisible(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sideMenuActive, alertActive, overlayActive]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      void NavigationBar.setButtonStyleAsync("light");
    }
  }, [overlayActive, alertActive]);

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
    // ✅ [수정] 프리미엄 유저는 세션 타이머 로직 무시
    if (stateRef.current.isPremium) {
        clearSessionTimers();
        progressAnim.setValue(0);
        return null; // 타이머 기반 시작 아님
    }

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
    // ✅ [수정] 프리미엄 유저는 타이머 없이 바로 시작 처리
    if (stateRef.current.isPremium) {
        setIsEnabled(true);
        if (AppSwitchModule?.saveSettings) {
            AppSwitchModule.saveSettings(pkgOverride ?? stateRef.current.targetPackage, true);
        }
        clearSessionTimers();
        progressAnim.setValue(0); // 로고 상태 활성화 고정
        return;
    }

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

    if (adGateInFlightRef.current) return;

    if (!ad?.show || !ad?.load) {
      resetAdGateState();
      showAlert("알림", "광고를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    adGateInFlightRef.current = true;
    pendingSaveRef.current = false;
    pendingStartRef.current = true;

    if (adLoadedRef.current) {
      setAlertVisible(false);
      ad.show();
    } else {
      ad.load();
      showAlert("알림", "광고 로딩 중입니다. 잠시만 기다려주세요.");
    }
  };

  useEffect(() => {
    let mounted = true;

    let unsubLoaded: any = null;
    let unsubClosed: any = null;
    let unsubError: any = null;

    async function initializeApp() {
      try {
        try {
          await AsyncStorage.removeItem(BATTERY_OPT_PROMPTED_KEY);
        } catch {}

        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(true);
          StatusBar.setBackgroundColor("transparent");
          NavigationBar.setButtonStyleAsync("light");
        }

        try {
          await IAP.initConnection();
          const purchases = await IAP.getAvailablePurchases();
          const hasSub = purchases.some((p: any) => p.productId === 'monthly_sub' && p.transactionId);
          if (mounted) {
             setIsPremium(hasSub);
             if (hasSub) {
                 await AsyncStorage.setItem(PREMIUM_CACHE_KEY, '1');
             }
          }
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

          const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, AD_REQUEST_OPTIONS);
          interstitialRef.current = ad;

          unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
            adLoadedRef.current = true;
            if (mounted) setAdLoaded(true);

            if (!adGateInFlightRef.current) return;

            if ((pendingSaveRef.current || pendingStartRef.current) && interstitialRef.current?.show) {
              setAlertVisible(false);
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

            adGateInFlightRef.current = false;
            ad.load();
          });

          unsubError = ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
            console.warn("Ad Error:", err);

            adLoadedRef.current = false;
            if (mounted) setAdLoaded(false);

            const wasGated = adGateInFlightRef.current || pendingSaveRef.current || pendingStartRef.current;
            resetAdGateState();

            if (mounted && wasGated) {
              showAlert("알림", "광고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
            }

            const code = String(err?.code || '');
            const isNoFill = code.includes('no-fill') || code.includes('error-code-no-fill');

            setTimeout(() => {
              try { ad.load(); } catch {}
            }, isNoFill ? 15000 : 5000);
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

            // 프리미엄이면 타이머 없이, 아니면 타이머 시작
            if (stateRef.current.isPremium) {
                setIsEnabled(true);
                clearSessionTimers();
                progressAnim.setValue(0);
            } else {
                void startNewSessionAndEnable(pkg || stateRef.current.targetPackage);
            }
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
    const { targetPackage: pkg, isEnabled: enabled } = stateRef.current;

    if (!enabled || !pkg) return;

    // 광고 없이 즉시 실행
    launchTargetApp();
  }

  const launchTargetApp = () => {
    const { targetPackage: pkg } = stateRef.current;
    if (pkg && AppSwitchModule?.launchApp) {
      AppSwitchModule.launchApp(pkg);
    }
  };

  const handleSaveWithLogic = async () => {
    if (!targetPackage) {
      showAlert("알림", "앱을 선택해주세요.");
      return;
    }

    if (isPremium) {
      saveSettings();
      return;
    }

    if (adGateInFlightRef.current) return;

    const ad = interstitialRef.current;

    if (!adLoadedRef.current) {
      ad?.load();
      showAlert("알림", "광고를 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    adGateInFlightRef.current = true;
    pendingStartRef.current = false;
    pendingSaveRef.current = true;
    setAlertVisible(false);
    ad.show();
  };

  const saveSettings = () => {
    if (AppSwitchModule?.saveSettings) {
      AppSwitchModule.saveSettings(targetPackage, isEnabled);
      showAlert("저장 성공", ` 설정이 시스템에 반영되었습니다.`);
    }
  };

  const toggleEnabledByLogo = async () => {
    if (!targetPackage) {
      showAlert("알림", "앱을 선택해주세요.");
      return;
    }

    if (!isEnabled) {
      if (adGateInFlightRef.current) return;

      if (AppSwitchModule?.isAccessibilityServiceEnabled) {
        const isGranted = await AppSwitchModule.isAccessibilityServiceEnabled();
        if (!isGranted) {
          resetAdGateState();
          showAlert(
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

      if (!batteryBypassOnceRef.current) {
        const okBattery = await ensureBatteryOptimizationIgnored();
        if (!okBattery) return;
      } else {
        batteryBypassOnceRef.current = false;
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
      // ✅ [수정] 프리미엄은 바로 실행 (세션 로직 호출 X)
      setIsEnabled(true);
      if (AppSwitchModule?.saveSettings) {
         AppSwitchModule.saveSettings(targetPackage, true);
      }
      clearSessionTimers();
      progressAnim.setValue(0);
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

  const alertHasTwo = alertButtons.length >= 2;
  const primaryIndex = alertHasTwo ? 1 : 0;
  const primaryBtn = alertButtons[primaryIndex] || { text: '확인' };
  const secondaryBtn = alertHasTwo ? alertButtons[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <SafeAreaView pointerEvents="none" edges={['top', 'left', 'right']} style={styles.gaugeSafeArea}>
          {/* ✅ [수정] 프리미엄일 경우 게이지 바 숨김 */}
          <View style={[styles.gaugeOuter, { opacity: (isEnabled && !isPremium) ? 1 : 0 }]}>
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
            <TouchableOpacity onPress={openSideMenu} activeOpacity={0.85} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>☰</Text>
            </TouchableOpacity>
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
              <View style={styles.logoStack}>
                <Image
                  source={require('./assets/app-logo.png')}
                  style={[styles.logoImage, styles.logoAbsolute, { opacity: isEnabled ? 0 : 0.4 }]}
                  resizeMode="contain"
                />
                <Animated.Image
                  source={require('./assets/app-logo2.png')}
                  style={[styles.logoImage, styles.logoAbsolute, { opacity: isEnabled ? (logo2Opacity as any) : 0 }]}
                  resizeMode="contain"
                />
                <Animated.Image
                  source={require('./assets/app-logo.png')}
                  style={[styles.logoImage, styles.logoAbsolute, { opacity: isEnabled ? (logoOpacity as any) : 0 }]}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>

            <Text style={[styles.statusLabel, { color: isEnabled ? '#1dd4f5' : '#555' }]}>
              {isEnabled ? "System Online" : "System Offline"}
            </Text>

            <Text
              pointerEvents="none"
              style={[styles.tapToStartHint, { opacity: isEnabled ? 0 : 1 }]}
            >
              ▲ TAB TO START ▲
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
                <Text style={styles.fabText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <SafeAreaView style={styles.adSafeArea} edges={['bottom']}>
          <View style={styles.adContainer}>
            <BannerAd
              unitId={BANNER_UNIT_ID}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={AD_REQUEST_OPTIONS}
            />
          </View>
        </SafeAreaView>

        <Animated.View
          pointerEvents={overlayActive ? "auto" : "none"}
          style={[styles.overlayRoot, { opacity: overlayAnim }]}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />
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
        </Animated.View>

        <Animated.View
          pointerEvents={alertActive ? "auto" : "none"}
          style={[styles.alertRoot, { opacity: alertAnim }]}
        >
          <View style={styles.alertOverlay}>
            <View style={StyleSheet.absoluteFillObject} />
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>{alertTitle}</Text>
              {!!alertMessage && <Text style={styles.alertMessage}>{alertMessage}</Text>}
              <View style={[styles.alertButtonsRow, alertHasTwo ? styles.alertButtonsTwo : styles.alertButtonsOne]}>
                {secondaryBtn ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => pressAlertButton(secondaryBtn)}
                    style={[styles.alertButton, styles.alertButtonSecondary]}
                  >
                    <Text style={styles.alertButtonSecondaryText}>{secondaryBtn.text}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => pressAlertButton(primaryBtn)}
                  style={[
                    styles.alertButton,
                    styles.alertButtonPrimary,
                    alertHasTwo ? styles.alertButtonPrimaryTwo : styles.alertButtonPrimaryOne
                  ]}
                >
                  <Text style={styles.alertButtonPrimaryText}>{primaryBtn.text}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents={sideMenuActive ? "auto" : "none"}
          style={[styles.sideMenuRoot, { opacity: sideMenuAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeSideMenu}
          />
          <Animated.View
            style={[
              styles.sideMenuPanel,
              { transform: [{ translateX: sideMenuTranslateX as any }] },
            ]}
          >
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuHeaderTitle}>MENU</Text>
            </View>

            <View style={styles.membershipBox}>
              <Text style={styles.membershipTitle}>내 멤버쉽등급</Text>
              <Text style={styles.membershipValue}>{isPremium ? "프리미엄" : "Free version"}</Text>
            </View>

            <TouchableOpacity
              style={[styles.sideMenuItem, styles.sideMenuItemFirst]}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('AdRemovePlan');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>💎</Text>
                <Text style={styles.sideMenuItemText}>광고제거 플랜</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideMenuItem}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('Help');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>?</Text>
                <Text style={styles.sideMenuItemText}>도움말</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideMenuItem}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('Language');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>A</Text>
                <Text style={styles.sideMenuItemText}>언어변경</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideMenuItem}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('AppInfo');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>i</Text>
                <Text style={styles.sideMenuItemText}>앱정보</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideMenuItem}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('TermsPrivacy');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>§</Text>
                <Text style={styles.sideMenuItemText}>약관 및 개인정보처리지침</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideMenuItem}
              activeOpacity={0.85}
              onPress={() => {
                requestNavigate('SubscriptionManage');
              }}
            >
              <View style={styles.sideMenuItemLeft}>
                <Text style={styles.sideMenuItemIcon}>S</Text>
                <Text style={styles.sideMenuItemText}>구독관리</Text>
              </View>
              <Text style={styles.sideMenuItemChevron}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: NAV_BG },
            animation: 'none',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AdRemovePlan" component={AdRemovePlanScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="AppInfo" component={AppInfoScreen} />
          <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
          <Stack.Screen name="SubscriptionManage" component={SubscriptionManageScreen} />
        </Stack.Navigator>
      </NavigationContainer>
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
  badgePremium: { backgroundColor: 'rgba(0,122,255,0.15)', borderColor: '#1dd4f5' },
  premiumText: { fontSize: 9, fontWeight: '800', color: '#ccc', letterSpacing: 0.5 },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30
  },
  tapToStartHint: {
    color: '#979797',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: 0,
    marginBottom: 40,
    textTransform: 'uppercase'
  },
  logoContainer: {
    marginBottom: 15,
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
    marginBottom: 0,
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

  overlayRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 9999
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

    alertRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertBox: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#0f0f0f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1dd4f5',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14
  },
  alertTitle: {
    color: '#eaeaea',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  alertMessage: {
    color: '#bdbdbd',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    textAlign: 'center'
  },
  alertButtonsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  alertButtonsOne: {
    justifyContent: 'center'
  },
  alertButtonsTwo: {
    justifyContent: 'space-between'
  },
  alertButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertButtonPrimary: {
    borderColor: '#1dd4f5',
    backgroundColor: 'rgba(29,212,245,0.10)'
  },
  alertButtonSecondary: {
    borderColor: '#2b2b2b',
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  alertButtonPrimaryOne: {
    width: '100%'
  },
  alertButtonPrimaryTwo: {
    flex: 1,
    marginLeft: 10
  },
  alertButtonSecondaryTwo: {
    flex: 1,
    marginRight: 10
  },
  alertButtonSecondaryText: {
    color: '#bdbdbd',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  alertButtonPrimaryText: {
    color: '#1dd4f5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4
  },

  menuButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    zIndex: 20
  },
  menuButtonText: {
    color: '#c8d0d4',
    fontSize: 18,
    fontWeight: '700'
  },

  sideMenuRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 9500,
    backgroundColor: 'rgba(0,0,0,0.65)'
  },
  sideMenuPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDE_MENU_WIDTH,
    backgroundColor: '#0b0b0b',
    borderRightWidth: 1,
    borderRightColor: '#1f1f1f',
    paddingTop: Platform.OS === 'android'
      ? (StatusBar.currentHeight || 20) + 40
      : 10 + 12,
  },
  sideMenuHeader: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#171717'
  },
  sideMenuHeaderTitle: {
    color: '#eaeaea',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  membershipBox: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1dd4f5',
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  membershipTitle: {
    color: '#bdbdbd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  membershipValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.2
  },
  sideMenuItemFirst: {
    marginTop: 6
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#151515'
  },
  sideMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sideMenuItemIcon: {
    width: 26,
    textAlign: 'center',
    marginRight: 10,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '800'
  },
  sideMenuItemText: {
    color: '#d7d7d7',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  sideMenuItemChevron: {
    color: '#444',
    fontSize: 20,
    marginTop: 1
  },

});