import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Image, StatusBar, StyleSheet, Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import BackButton from '../components/BackButton';

const { width: SW } = Dimensions.get('window');
const BTN_SIZE = (SW - 56) / 2; // 2 columnas con padding

const emotions = ['Alegría', 'Miedo', 'Tristeza', 'Enojo', 'Asco', 'Asombro'];
const colors   = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899'];

const emotionImages = {
  'Alegría':  require('../assets/images/emoalegria.png'),
  'Miedo':    require('../assets/images/emomiedo.png'),
  'Tristeza': require('../assets/images/emotristeza.png'),
  'Enojo':    require('../assets/images/emoenojo.png'),
  'Asco':     require('../assets/images/emoasco.png'),
  'Asombro':  require('../assets/images/emoasombro.png'),
};
const emotionSounds = {
  'Alegría':  require('../assets/sounds/Button1.mp3'),
  'Miedo':    require('../assets/sounds/Button2.mp3'),
  'Tristeza': require('../assets/sounds/Button3.mp3'),
  'Enojo':    require('../assets/sounds/Button4.mp3'),
  'Asco':     require('../assets/sounds/Button5.mp3'),
  'Asombro':  require('../assets/sounds/Button6.mp3'),
};

export default function SimonSays() {
  const [gameState, setGameState] = useState('start');
  const [sequence, setSequence]   = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [score, setScore]         = useState(0);
  const [record, setRecord]       = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [highlighted, setHighlighted] = useState(null);
  const [jumpAnim]                = useState(new Animated.Value(1));
  const [sound, setSound]         = useState();
  const [isShowingSeq, setIsShowingSeq] = useState(false);

  async function playSound(emotion) {
    try {
      const { sound } = await Audio.Sound.createAsync(emotionSounds[emotion]);
      setSound(sound);
      await sound.playAsync();
      setTimeout(() => sound.stopAsync(), 300);
    } catch (e) { console.log('sound error', e); }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useEffect(() => {
    if (gameState !== 'countdown') return;
    let timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) { clearInterval(timer); startGame(); return 3; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && sequence.length > 0) showSequence();
  }, [sequence]);

  const startGame = () => {
    setSequence([emotions[Math.floor(Math.random() * emotions.length)]]);
    setUserInput([]);
    setScore(0);
    setGameState('playing');
  };

  const getSpeed = () => Math.max(800 - score * 50, 300);

  const showSequence = async () => {
    setIsShowingSeq(true);
    const speed = getSpeed();
    for (let i = 0; i < sequence.length; i++) {
      setHighlighted(sequence[i]);
      await playSound(sequence[i]);
      Animated.sequence([
        Animated.timing(jumpAnim, { toValue: 1.15, duration: speed / 2, useNativeDriver: true }),
        Animated.timing(jumpAnim, { toValue: 1,    duration: speed / 2, useNativeDriver: true }),
      ]).start();
      await new Promise(r => setTimeout(r, speed));
      setHighlighted(null);
      await new Promise(r => setTimeout(r, speed / 2));
    }
    setIsShowingSeq(false);
  };

  const handleEmotionPress = async (emotion) => {
    if (isShowingSeq) return;
    const newInput = [...userInput, emotion];
    setUserInput(newInput);
    await playSound(emotion);

    if (newInput.join() === sequence.slice(0, newInput.length).join()) {
      if (newInput.length === sequence.length) {
        setTimeout(() => {
          setSequence([...sequence, emotions[Math.floor(Math.random() * emotions.length)]]);
          setUserInput([]);
          setScore(s => s + 1);
        }, 800);
      }
    } else {
      setRecord(r => Math.max(r, score));
      setGameState('gameover');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <BackButton top={StatusBar.currentHeight + 8} />

      {/* PANTALLA START */}
      {gameState === 'start' && (
        <>
          <Image
            source={require('../assets/images/port_simonji.gif')}
            style={{ width: '100%', height: '100%', position: 'absolute' }} 
            resizeMode="cover"
          />
          <TouchableOpacity style={s.startBtn} onPress={() => setGameState('countdown')}>
            <Text style={s.startBtnText}>¡JUGAR!</Text>
          </TouchableOpacity>
        </>
      )}

      {/* CUENTA REGRESIVA */}
      {gameState === 'countdown' && (
        <View style={s.countdownContainer}>
          <Text style={s.countdownNum}>{countdown}</Text>
          <Text style={s.countdownSub}>¡Prepárate!</Text>
        </View>
      )}

      {/* JUGANDO */}
      {gameState === 'playing' && (
        <View style={s.playContainer}>
          {/* Header */}
          <View style={s.playHeader}>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>Puntaje</Text>
              <Text style={s.scoreNum}>{score}</Text>
            </View>
            <Text style={s.gameTitle}>SIMONJI</Text>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>Récord</Text>
              <Text style={s.scoreNum}>{record}</Text>
            </View>
          </View>

          {isShowingSeq && (
            <Text style={s.watchText}>👀 Observa la secuencia...</Text>
          )}

          {/* Grid de emociones */}
          <View style={s.grid}>
            {emotions.map((emotion, index) => (
              <Animated.View
                key={emotion}
                style={{ transform: [{ scale: highlighted === emotion ? jumpAnim : 1 }] }}
              >
                <TouchableOpacity
                  onPress={() => handleEmotionPress(emotion)}
                  activeOpacity={0.8}
                  style={[
                    s.emotionBtn,
                    { backgroundColor: colors[index] },
                    highlighted === emotion && s.emotionBtnHighlighted,
                  ]}
                >
                  <Image source={emotionImages[emotion]} style={s.emotionImg} resizeMode="contain" />
                  <Text style={s.emotionLabel}>{emotion}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      {/* GAME OVER */}
      {gameState === 'gameover' && (
        <View style={s.gameoverContainer}>
          <Text style={s.gameoverEmoji}>😅</Text>
          <Text style={s.gameoverTitle}>¡Casi!</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{score}</Text>
              <Text style={s.statLabel}>Puntaje</Text>
            </View>
            <View style={[s.statBox, s.statBoxBig]}>
              <Text style={[s.statNum, { color: '#f59e0b' }]}>{record}</Text>
              <Text style={s.statLabel}>Récord 🏆</Text>
            </View>
          </View>
          <TouchableOpacity style={s.btn} onPress={() => setGameState('countdown')}>
            <Text style={s.btnText}>Volver a jugar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setGameState('start')}>
            <Text style={[s.btnText, { color: '#0c4a6e' }]}>Menú principal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 50,
    elevation: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'PlayChickens',
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownNum: {
    fontSize: 96,
    fontFamily: 'SlaberlinBold',
    color: '#38bdf8',
  },
  countdownSub: {
    fontSize: 20,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.6)',
    marginTop: -10,
  },
  playContainer: {
    flex: 1,
    width: '100%',
    paddingTop: (StatusBar.currentHeight || 24) + 44,
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.6)',
  },
  scoreNum: {
    fontSize: 22,
    fontFamily: 'SlaberlinBold',
    color: '#fff',
  },
  gameTitle: {
    fontSize: 22,
    fontFamily: 'PlayChickens',
    color: '#38bdf8',
  },
  watchText: {
    textAlign: 'center',
    fontFamily: 'SlaberlinBold',
    color: '#fbbf24',
    fontSize: 14,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  emotionBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  emotionBtnHighlighted: {
    elevation: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  emotionImg: {
    width: BTN_SIZE * 0.55,
    height: BTN_SIZE * 0.55,
  },
  emotionLabel: {
    fontFamily: 'SlaberlinBold',
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
  },
  gameoverContainer: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
  },
  gameoverEmoji: { fontSize: 64, marginBottom: 8 },
  gameoverTitle: {
    fontSize: 36,
    fontFamily: 'PlayChickens',
    color: '#fff',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  statBoxBig: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  statNum: {
    fontSize: 32,
    fontFamily: 'SlaberlinBold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  btn: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnText: {
    color: '#fff',
    fontFamily: 'SlaberlinBold',
    fontSize: 16,
  },
});
