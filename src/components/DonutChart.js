import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../constants/theme';

const ArcSegment = ({ percentage, color, rotation, delay }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  if (percentage <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          borderColor: color,
          borderTopColor: color,
          borderRightColor: percentage > 25 ? color : 'transparent',
          borderBottomColor: percentage > 50 ? color : 'transparent',
          borderLeftColor: percentage > 75 ? color : 'transparent',
          transform: [{ rotate: `${rotation}deg` }, { scale }],
        },
      ]}
    />
  );
};

export default function DonutChart({ data, centerLabel, centerValue, size = 140 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  let currentRotation = 0;
  const segments = data.filter(d => d.value > 0).map((d, i) => {
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    const seg = { ...d, percentage: pct, rotation: currentRotation, delay: i * 150 };
    currentRotation += (pct / 100) * 360;
    return seg;
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />

      {/* Colored segments as bars */}
      <View style={[styles.segmentContainer, { width: size, height: size }]}>
        {segments.map((seg, i) => (
          <View
            key={i}
            style={[
              styles.barSegment,
              {
                backgroundColor: seg.color,
                width: `${Math.max(seg.percentage, 2)}%`,
                transform: [{ rotate: `${seg.rotation}deg` }],
              },
            ]}
          />
        ))}
      </View>

      {/* Visual bar chart inside the donut */}
      <View style={styles.barChart}>
        {segments.map((seg, i) => {
          const barHeight = total > 0 ? (seg.value / total) * 60 : 0;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: Math.max(barHeight, 4),
                  backgroundColor: seg.color,
                  opacity: fadeAnim,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Center text */}
      <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
        <Text style={styles.centerValue}>{centerValue}</Text>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
      </Animated.View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label}</Text>
            <Text style={styles.legendValue}>{d.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  ring: {
    position: 'absolute',
    borderWidth: 12,
    borderColor: COLORS.textMuted + '20',
  },
  segmentContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 12,
    borderRadius: 70,
  },
  barSegment: {
    position: 'absolute',
    height: 12,
    borderRadius: 6,
    top: 0,
    left: 0,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
    paddingHorizontal: 10,
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    bottom: -50,
  },
  centerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  centerLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  legend: {
    position: 'absolute',
    bottom: -100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
});
