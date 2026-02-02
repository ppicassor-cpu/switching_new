import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdRemovePlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>광고제거 플랜 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
