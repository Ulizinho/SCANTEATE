import { Pressable, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

/**
 * Botón de retroceso consistente en toda la app.
 * Uso: <BackButton />
 * Personalizable: <BackButton top={60} onPress={() => router.replace('/home')} />
 */
export default function BackButton({ top = 50, onPress }) {
  const handlePress = onPress || (() => router.back());
  return (
    <Pressable
      style={[styles.btn, { top }]}
      onPress={handlePress}
      hitSlop={12}
    >
      <AntDesign name="left" size={22} color="#0369a1" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
    backgroundColor: '#e2e8f0',
    padding: 9,
    borderRadius: 10,
    opacity: 0.9,
    elevation: 2,
  },
});
