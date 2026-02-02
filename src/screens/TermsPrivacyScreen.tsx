import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TermsPrivacyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>약관 및 개인정보처리지침 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
