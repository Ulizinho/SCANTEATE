import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, Pressable, Text, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export default function CuentoPDF() {
  const { cuentoTitle, cuentoPath } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <AntDesign name="left" size={24} color="#0369a1" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {cuentoTitle || 'Cuento'}
        </Text>
      </View>
      <WebView
        source={{ uri: cuentoPath }}
        style={{ flex: 1 }}
        onError={(error) => console.error('WebView error: ', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight + 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'SuperFeel',
    color: '#0c4a6e',
    flex: 1,
  },
});
