import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View, Dimensions, Pressable } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  visible: boolean;
  routineName?: string;
  rewardText?: string;
  onComplete: () => void;
};

// Konfeti taneciği bileşeni - Patlama (Explosion) efekti için güncellendi
const ConfettiPiece = ({ index, delay }: { index: number; delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  // Rastgele değerler
  const color = useMemo(() => {
    const colors = ['#facc15', '#34d399', '#3b82f6', '#f87171', '#e879f9', '#fbbf24', '#ff7e5f', '#feb47b'];
    return colors[index % colors.length];
  }, [index]);

  // Patlama yönü ve mesafesi - Tüm ekrana yayılacak şekilde
  const angle = useMemo(() => Math.random() * Math.PI * 2, []); // 360 derece
  const velocity = useMemo(() => 150 + Math.random() * 350, []); // Fırlama hızı
  const xTarget = useMemo(() => Math.cos(angle) * velocity, [angle, velocity]);
  const yTarget = useMemo(() => Math.sin(angle) * velocity - 100, [angle, velocity]); // Biraz yukarı eğim
  
  // Boyut ve dönüş
  const size = useMemo(() => 6 + Math.random() * 8, []);
  const rotate = useMemo(() => `${Math.random() * 1080}deg`, []);
  const duration = useMemo(() => 2000 + Math.random() * 1000, []);

  useEffect(() => {
    anim.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: duration,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, [anim, delay, duration]);

  const animatedStyle = {
    opacity: anim.interpolate({
      inputRange: [0, 0.1, 0.7, 1],
      outputRange: [0, 1, 1, 0]
    }),
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, xTarget]
        })
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, yTarget, yTarget + 250] // Önce fırlar sonra düşer
        })
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', rotate]
        })
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1.5, 0.6]
        })
      }
    ]
  };

  return (
    <Animated.View 
      style={[
        styles.confetti, 
        { 
          width: size, 
          height: index % 2 === 0 ? size : size * 0.5,
          backgroundColor: color, 
          borderRadius: index % 3 === 0 ? size/2 : 1,
        },
        animatedStyle
      ]} 
    />
  );
};

export function RoutineCompletedAnimation({
  visible,
  routineName,
  rewardText,
  onComplete,
}: Props): React.ReactElement | null {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];

  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  const sparkles = useMemo(
    () => [
      { top: 18, left: 24, icon: 'sparkles' as const, delay: 40 },
      { top: 38, right: 36, icon: 'star' as const, delay: 140 },
      { top: 98, left: 42, icon: 'sparkles' as const, delay: 230 },
      { bottom: 52, right: 28, icon: 'star' as const, delay: 300 },
      { bottom: 30, left: 50, icon: 'sparkles' as const, delay: 450 },
    ],
    [],
  );

  useEffect(() => {
    if (!visible) {
      setShowConfetti(false);
      return;
    }

    scale.setValue(0.7);
    opacity.setValue(0);
    sparkle.setValue(0);
    setShowConfetti(true);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 12,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.timing(sparkle, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, sparkle, visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <Pressable 
        style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.45)' }]}
        onPress={onComplete}
      >
        
        {/* Konfeti Katmanı - Patlama Merkezi */}
        {showConfetti && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
             {Array.from({ length: 100 }).map((_, i) => (
               <View key={i} style={{ position: 'absolute' }}>
                 <ConfettiPiece index={i} delay={i * 8} />
               </View>
             ))}
          </View>
        )}

        <Animated.View style={[
          styles.card, 
          { 
            opacity, 
            transform: [{ scale }],
            backgroundColor: isDark ? '#1e1b4b' : colors.card,
            borderColor: isDark ? 'rgba(167, 139, 250, 0.4)' : colors.border
          }
        ]}>
          <TouchableOpacity
            onPress={onComplete}
            style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, borderColor: colors.border }]}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Ionicons name="close" size={18} color={isDark ? '#fff' : colors.text} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : `${colors.success}10` }]}>
            <Animated.View style={{
              transform: [{
                scale: sparkle.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1.2, 1]
                })
              }]
            }}>
              <Ionicons name="trophy" size={56} color="#fbbf24" />
            </Animated.View>
          </View>
          
          <Text style={[styles.title, { color: isDark ? '#fff' : colors.text }]}>Goal Completed!</Text>
          
          <View style={styles.contentWrap}>
            <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              Group approved your photo
              {routineName ? ` for "${routineName}"` : ''}.
            </Text>
            
            {!!rewardText && (
              <View style={[styles.rewardBadge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : '#f0fdf4' }]}>
                <Ionicons name="sparkles" size={14} color="#34d399" />
                <Text style={styles.rewardText}>{rewardText}</Text>
              </View>
            )}
          </View>

          {sparkles.map((s, idx) => (
            <Animated.View
              key={`${s.icon}-${idx}`}
              style={[
                styles.sparkle,
                s,
                {
                  opacity: sparkle,
                  transform: [
                    {
                      scale: sparkle.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.3, 1],
                      }),
                    },
                    {
                      rotate: sparkle.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '45deg'],
                      }),
                    }
                  ],
                },
              ]}
            >
              <Ionicons name={s.icon} size={22} color="#facc15" />
            </Animated.View>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 36,
    borderWidth: 1.5,
    paddingTop: 45,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  confetti: {
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  contentWrap: {
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  rewardText: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '800',
  },
  sparkle: {
    position: 'absolute',
    zIndex: -1,
  },
});
