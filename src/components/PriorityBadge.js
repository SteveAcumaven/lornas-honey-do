import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PRIORITY_LEVELS } from '../constants/theme';

export default function PriorityBadge({ priority, size = 'small' }) {
  const level = PRIORITY_LEVELS.find((p) => p.key === priority) || PRIORITY_LEVELS[1];
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, { backgroundColor: level.color + '22', borderColor: level.color }, isLarge && styles.badgeLarge]}>
      <Text style={[styles.text, { color: level.color }, isLarge && styles.textLarge]}>
        {level.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: 14,
  },
});
