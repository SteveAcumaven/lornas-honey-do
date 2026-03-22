import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, CATEGORIES, PRIORITY_LEVELS, ROOMS, EFFORT_LEVELS } from '../constants/theme';
import { addTask } from '../storage/taskStore';
import DatePicker from '../components/DatePicker';
import HoneycombHeader from '../components/HoneycombHeader';

const SectionHeader = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

const ChipSelector = ({ options, selected, onSelect, labelKey = 'label', valueKey = 'key' }) => (
  <View style={styles.chipContainer}>
    {options.map((opt) => {
      const isSelected = selected === (typeof opt === 'string' ? opt : opt[valueKey]);
      const label = typeof opt === 'string' ? opt : opt[labelKey];
      return (
        <TouchableOpacity
          key={typeof opt === 'string' ? opt : opt[valueKey]}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => onSelect(typeof opt === 'string' ? opt : opt[valueKey])}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [room, setRoom] = useState('Kitchen');
  const [effort, setEffort] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [nagEnabled, setNagEnabled] = useState(true);
  const [rewardNote, setRewardNote] = useState('');

  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Oops!', 'You need to tell him what to do! Add a title. 📝');
      return;
    }

    const parsedDue = dueDate ? new Date(dueDate) : null;

    await addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      room,
      effort,
      dueDate: parsedDue?.toISOString() || null,
      nagEnabled,
      rewardNote: rewardNote.trim(),
    });

    // Fun bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    const funMessages = [
      "Added to the hive! He can't escape now! 🐝",
      "Buzz buzz! Task submitted! 🍯",
      "Roger that! The queen bee has spoken! 👑",
      "Added! The hive is buzzing! 🐝",
      "On the list! Bee-lieve it! 🍯",
    ];
    Alert.alert(
      '✅ Task Added!',
      funMessages[Math.floor(Math.random() * funMessages.length)],
      [{ text: 'Add Another', style: 'cancel' }, { text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') }]
    );

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('other');
    setPriority('medium');
    setRoom('Kitchen');
    setEffort('medium');
    setDueDate('');
    setNagEnabled(true);
    setRewardNote('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HoneycombHeader
          title="Lorna's Honey-Do List"
          subtitle="What needs doing around the hive? 🍯"
        />

        {/* Title */}
        <SectionHeader title="What needs to be done?" subtitle="Be specific so he can't play dumb 😏" />
        <TextInput
          style={styles.input}
          placeholder="e.g., Fix the leaky kitchen faucet"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <SectionHeader title="Details" subtitle="The more detail, the fewer excuses" />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what needs to be done, where exactly, what's wrong..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Category */}
        <SectionHeader title="Category" subtitle="What type of task is this?" />
        <ChipSelector options={CATEGORIES} selected={category} onSelect={setCategory} />

        {/* Priority */}
        <SectionHeader title="How urgent is this?" subtitle="Choose wisely..." />
        <ChipSelector options={PRIORITY_LEVELS} selected={priority} onSelect={setPriority} />

        {/* Room / Location */}
        <SectionHeader title="Where?" subtitle="Room or area of the house" />
        <ChipSelector options={ROOMS} selected={room} onSelect={setRoom} />

        {/* Effort Level */}
        <SectionHeader title="Estimated Effort" subtitle="How big of a job is this?" />
        <ChipSelector options={EFFORT_LEVELS} selected={effort} onSelect={setEffort} />

        {/* Due Date */}
        <SectionHeader title="Due Date" subtitle="When does this need to be done by?" />
        <DatePicker value={dueDate} onChange={setDueDate} />

        {/* Reward / Incentive */}
        <SectionHeader title="Reward / Incentive" subtitle="A little motivation never hurts! 🎁" />
        <TextInput
          style={styles.input}
          placeholder="e.g., I'll make your favorite dinner! 🍝"
          placeholderTextColor={COLORS.textMuted}
          value={rewardNote}
          onChangeText={setRewardNote}
          maxLength={150}
        />

        {/* Nag Toggle */}
        <TouchableOpacity style={styles.toggleRow} onPress={() => setNagEnabled(!nagEnabled)}>
          <View style={[styles.toggle, nagEnabled && styles.toggleActive]}>
            <View style={[styles.toggleDot, nagEnabled && styles.toggleDotActive]} />
          </View>
          <View>
            <Text style={styles.toggleLabel}>Enable Nagging Mode</Text>
            <Text style={styles.toggleHint}>
              {nagEnabled ? "He'll get reminders if it's overdue 😈" : "Being nice about it... for now 😇"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Submit */}
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitIcon}>🐝</Text>
            <Text style={styles.submitText}>Add to the Hive!</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    gap: 12,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.textMuted,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
});
