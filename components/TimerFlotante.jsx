import { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, StatusBar, 
  ToastAndroid, Animated, PanResponder, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleFont = (size) => (SCREEN_WIDTH / 375) * size;
const BUBBLE_SIZE = scaleFont(75); 
const MARGIN = 10; // Margen mínimo para que no toque el borde físico

function formatTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const EXCLUIR = ['/bloqueado', '/timer', '/index', '/loginBefore', '/login', '/register'];

export default function TimerFlotante() {
  const [restante, setRestante] = useState(null);
  const [estaPausado, setEstaPausado] = useState(false);
  const ultimoClic = useRef(0);
  const pathname = usePathname();

  // Iniciamos la burbuja en la derecha (SCREEN_WIDTH - tamaño - margen)
  const pan = useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - BUBBLE_SIZE - MARGIN, 
    y: 150 
  })).current;
  
  const escalaAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        Animated.spring(escalaAnim, { toValue: 1.1, useNativeDriver: false }).start();
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        Animated.spring(escalaAnim, { toValue: 1, useNativeDriver: false }).start();

        // --- CÁLCULO DE LÍMITES ABSOLUTOS ---
        
        // 1. Determinar orilla (X)
        const centroX = SCREEN_WIDTH / 2;
        const finalX = pan.x._value + (BUBBLE_SIZE / 2);
        const irALaDerecha = finalX > centroX;
        
        let destinoX = irALaDerecha 
          ? SCREEN_WIDTH - BUBBLE_SIZE - MARGIN 
          : MARGIN;

        // 2. Determinar altura (Y) - Evitar que se escape arriba o abajo
        const topLimit = (StatusBar.currentHeight || 24) + MARGIN;
        const bottomLimit = SCREEN_HEIGHT - BUBBLE_SIZE - 100; // Espacio para botones de abajo
        
        let destinoY = pan.y._value;
        if (destinoY < topLimit) destinoY = topLimit;
        if (destinoY > bottomLimit) destinoY = bottomLimit;

        // 3. Ejecutar imán
        Animated.spring(pan, {
          toValue: { x: destinoX, y: destinoY },
          friction: 8,
          tension: 50,
          useNativeDriver: false
        }).start();
      },
    })
  ).current;

  // Lógica del timer (sin cambios)
  useEffect(() => {
    const tick = async () => {
      try {
        const res = await AsyncStorage.getItem('timerConfig');
        const data = res ? JSON.parse(res) : null;
        if (!data?.activo) { setRestante(null); return; }
        if (data.pausado) {
          setRestante(data.segundosRestantes);
          setEstaPausado(true);
        } else {
          setEstaPausado(false);
          const diff = Math.max(0, Math.ceil((data.finEpoch - Date.now()) / 1000));
          setRestante(diff);
          if (diff <= 0) {
            await AsyncStorage.setItem('timerConfig', JSON.stringify({ ...data, activo: false }));
            router.replace('/bloqueado');
          }
        }
      } catch (e) { console.log(e); }
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const manejarPresion = async () => {
    const ahora = Date.now();
    if (ahora - ultimoClic.current < 300) {
      if (estaPausado) {
        const res = await AsyncStorage.getItem('timerConfig');
        const data = JSON.parse(res);
        await AsyncStorage.setItem('timerConfig', JSON.stringify({
          ...data, pausado: false, alertaActivada: false,
          finEpoch: Date.now() + (data.segundosRestantes * 1000)
        }));
        setEstaPausado(false);
      } else { router.navigate('/timer'); }
    } else {
      setTimeout(() => {
        if (Date.now() - ultimoClic.current >= 300) router.navigate('/timer');
      }, 300);
    }
    ultimoClic.current = ahora;
  };

  const mostrarPill = restante !== null && !EXCLUIR.some(p => pathname === p || pathname?.startsWith(p));
  if (!mostrarPill) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        pan.getLayout(), // Esto aplica top y left automáticamente
        { transform: [{ scale: escalaAnim }] }
      ]}
    >
      <Pressable 
        style={[styles.bubble, estaPausado && styles.bubblePausado]} 
        onPress={manejarPresion}
      >
        <AntDesign 
          name={estaPausado ? "playcircleo" : "clockcircle"} 
          size={scaleFont(20)} 
          color={estaPausado ? "#b91c1c" : "#0369a1"} 
        />
        <Text style={[styles.texto, estaPausado && {color: "#b91c1c"}]}>
          {estaPausado ? "PAUSA" : formatTiempo(restante)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // IMPORTANTE: No ponemos top/right/left aquí, se encarga el pan.getLayout()
    zIndex: 9999,
  },
  bubble: { 
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#fff', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, 
    borderColor: '#7dd3fc', 
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bubblePausado: { 
    borderColor: '#fcd34d',
    backgroundColor: '#fffbf0'
  },
  texto: { 
    fontSize: 11, 
    color: '#0369a1', 
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center'
  }
});