import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const FloatingEmoji = ({ emoji, delay, startX, startY, size = 24, range = 15 }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 600, delay, useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(translateX, { toValue: range, duration: 2500 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -range * 0.7, duration: 2800 + Math.random() * 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(translateY, { toValue: -range * 0.8, duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: range * 0.5, duration: 1700 + Math.random() * 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterp = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute', left: startX, top: startY, fontSize: size,
        opacity, transform: [{ translateX }, { translateY }, { rotate: rotateInterp }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

export default function HoneycombHeader({ title, subtitle }) {
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(25)).current;
  const glowPulse = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFade, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 700, delay: 300, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.5, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.2, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient layers */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      {/* Floating flowers & nature */}
      <FloatingEmoji emoji="🌸" delay={0} startX={15} startY={20} size={22} range={12} />
      <FloatingEmoji emoji="🌻" delay={200} startX={width - 55} startY={15} size={24} range={10} />
      <FloatingEmoji emoji="🌺" delay={400} startX={50} startY={85} size={18} range={14} />
      <FloatingEmoji emoji="🌼" delay={100} startX={width - 90} startY={80} size={20} range={11} />
      <FloatingEmoji emoji="🌷" delay={300} startX={width / 2 + 60} startY={22} size={18} range={10} />
      <FloatingEmoji emoji="💐" delay={500} startX={width / 2 - 80} startY={18} size={16} range={12} />

      {/* Floating bees */}
      <FloatingEmoji emoji="🐝" delay={600} startX={35} startY={45} size={22} range={20} />
      <FloatingEmoji emoji="🐝" delay={900} startX={width - 70} startY={50} size={18} range={18} />
      <FloatingEmoji emoji="🐝" delay={1200} startX={width / 2 - 15} startY={20} size={20} range={22} />

      {/* Glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
        <Text style={styles.logo}>🐝</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.subtitlePill}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.flowerStripe}>
          {['🌸', '🍯', '🌼', '🍯', '🌸'].map((c, i) => (
            <Text key={i} style={styles.stripeChar}>{c}</Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 55,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: COLORS.primary,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: COLORS.primaryDark,
    opacity: 0.3,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: COLORS.honey,
    opacity: 0.2,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  glow: {
    position: 'absolute',
    top: 45,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.accent,
    left: width / 2 - 70,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    fontSize: 60,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitlePill: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 14,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  flowerStripe: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  stripeChar: {
    fontSize: 16,
  },
});
