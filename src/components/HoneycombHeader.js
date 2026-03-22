import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const FloatingBee = ({ delay, startX, startY, size = 24 }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeIn = Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    });

    const flyX = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: 20, duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -15, duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const flyY = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -12, duration: 1200 + Math.random() * 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 1400 + Math.random() * 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const wobble = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    fadeIn.start();
    setTimeout(() => { flyX.start(); flyY.start(); wobble.start(); }, delay);
  }, []);

  const rotateInterp = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.Text
      style={[
        styles.bee,
        {
          left: startX,
          top: startY,
          fontSize: size,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate: rotateInterp }],
        },
      ]}
    >
      🐝
    </Animated.Text>
  );
};

const HoneycombCell = ({ x, y, size, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.15, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.hexagon,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 6,
          opacity,
          transform: [{ scale }, { rotate: '30deg' }],
        },
      ]}
    />
  );
};

export default function HoneycombHeader({ title, subtitle }) {
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFade, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 600, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const hexCells = [
    { x: 20, y: 15, size: 40, delay: 0 },
    { x: width - 70, y: 25, size: 35, delay: 100 },
    { x: 60, y: 55, size: 28, delay: 200 },
    { x: width - 110, y: 60, size: 32, delay: 150 },
    { x: width / 2 - 60, y: 20, size: 25, delay: 250 },
    { x: width / 2 + 40, y: 45, size: 30, delay: 300 },
    { x: 15, y: 90, size: 22, delay: 350 },
    { x: width - 50, y: 95, size: 26, delay: 200 },
  ];

  return (
    <View style={styles.container}>
      {/* Honeycomb pattern background */}
      {hexCells.map((cell, i) => (
        <HoneycombCell key={i} {...cell} />
      ))}

      {/* Floating bees */}
      <FloatingBee delay={400} startX={30} startY={30} size={22} />
      <FloatingBee delay={800} startX={width - 65} startY={50} size={18} />
      <FloatingBee delay={1200} startX={width / 2 - 20} startY={25} size={20} />

      {/* Glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
        <Text style={styles.logo}>🐝</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.honeyDrip}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {/* Decorative honeycomb stripe */}
        <View style={styles.stripeRow}>
          {['🍯', '⬡', '🍯', '⬡', '🍯'].map((c, i) => (
            <Text key={i} style={styles.stripeChar}>{c}</Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    paddingTop: 55,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
  },
  hexagon: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
  },
  bee: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    left: width / 2 - 60,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    fontSize: 56,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  honeyDrip: {
    marginTop: 6,
    backgroundColor: COLORS.accent + '40',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '500',
  },
  stripeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
    opacity: 0.5,
  },
  stripeChar: {
    fontSize: 12,
    color: COLORS.accent,
  },
});
