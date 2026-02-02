import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionManageScreen({ navigation }: any) {
  
  const openStoreSubscription = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    } else {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE SUBSCRIPTION</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.statusLabel}>현재 구독 상태</Text>
          {/* 실제로는 props나 context로 구독 상태를 받아와야 함 */}
          <Text style={styles.statusValue}>FREE VERSION</Text>
          <Text style={styles.statusDesc}>현재 무료 버전을 사용 중입니다.</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={openStoreSubscription}>
          <Text style={styles.actionText}>스토어에서 구독 관리하기 ↗</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          구독 취소 및 변경은 앱스토어/플레이스토어 설정에서 직접 진행해야 합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: { padding: 10 },
  backButtonText: { color: '#666', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#eee', fontSize: 16, fontWeight: '700' },
  content: { padding: 25 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333'
  },
  statusLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  statusValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  statusDesc: { color: '#888', fontSize: 14 },
  actionButton: {
    padding: 18,
    backgroundColor: '#222',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  actionText: { color: '#ddd', fontSize: 15, fontWeight: '600' },
  note: { marginTop: 20, color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 }
});