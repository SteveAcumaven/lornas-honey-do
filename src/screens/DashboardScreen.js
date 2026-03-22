import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, ENCOURAGEMENT_MESSAGES, NAGGING_MESSAGES, CATEGORIES } from '../constants/theme';
import { loadTasks, updateTask, deleteTask, getTaskStats } from '../storage/taskStore';
import TaskCard from '../components/TaskCard';

const FILTERS = [
  { key: 'all', label: 'All', icon: '🐝' },
  { key: 'pending', label: 'To Do', icon: '📋' },
  { key: 'in_progress', label: 'On It', icon: '🔨' },
  { key: 'done', label: 'Done', icon: '✅' },
  { key: 'overdue', label: 'Overdue', icon: '🔥' },
];

const SORT_OPTIONS = [
  { key: 'priority', label: '🚨 Priority' },
  { key: 'date', label: '🆕 Newest' },
  { key: 'due', label: '📅 Due Date' },
  { key: 'effort', label: '💪 Effort' },
];

const effortOrder = { quick: 0, easy: 1, medium: 2, hard: 3, project: 4 };

// Simple animated bar
const AnimatedBar = ({ value, maxValue, color, label, delay = 0 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxValue > 0 ? (value / maxValue) * 100 : 0,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, maxValue]);

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View
          style={[barStyles.fill, {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }]}
        />
      </View>
      <Text style={barStyles.value}>{value}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: COLORS.textLight, width: 70 },
  track: { flex: 1, height: 16, backgroundColor: COLORS.textMuted + '18', borderRadius: 8, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 8, minWidth: 2 },
  value: { fontSize: 14, fontWeight: '800', color: COLORS.text, width: 28, textAlign: 'right' },
});

// Progress circle using views (web-compatible)
const ProgressCircle = ({ percent, size = 90 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, delay: 200, useNativeDriver: true,
    }).start();
  }, []);

  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const color = clampedPercent >= 75 ? COLORS.success : clampedPercent >= 40 ? COLORS.honey : COLORS.statusPending;

  return (
    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 8, borderColor: COLORS.textMuted + '20',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Colored arc overlay using quarter-circle technique */}
        <View style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2,
          borderWidth: 8,
          borderTopColor: clampedPercent > 0 ? color : 'transparent',
          borderRightColor: clampedPercent > 25 ? color : 'transparent',
          borderBottomColor: clampedPercent > 50 ? color : 'transparent',
          borderLeftColor: clampedPercent > 75 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }} />
        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{Math.round(clampedPercent)}%</Text>
        <Text style={{ fontSize: 9, color: COLORS.textLight }}>Complete</Text>
      </View>
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchTasks = useCallback(async () => {
    const loaded = await loadTasks();
    setTasks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, [fetchTasks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'done') {
      const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      Alert.alert('Task Complete! 🐝', msg);
      await updateTask(id, { status: 'done', completedAt: new Date().toISOString() });
    } else if (newStatus === 'in_progress') {
      await updateTask(id, { status: 'in_progress', startedAt: new Date().toISOString() });
    } else {
      await updateTask(id, { status: newStatus });
    }
    fetchTasks();
  };

  const handleTaskPress = (task) => {
    const options = [{ text: 'Cancel', style: 'cancel' }];
    if (task.status !== 'done') {
      options.push({ text: '✅ Mark Done', onPress: () => handleStatusChange(task.id, 'done') });
    }
    if (task.status === 'pending') {
      options.push({ text: '🔨 Start Working', onPress: () => handleStatusChange(task.id, 'in_progress') });
    }
    options.push({
      text: '🗑️ Delete', style: 'destructive',
      onPress: () => {
        Alert.alert('Delete Task?', 'Are you sure? Lorna might notice... 🐝', [
          { text: 'Keep It', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTask(task.id); fetchTasks(); } },
        ]);
      },
    });
    const details = [];
    if (task.description) details.push(`📝 ${task.description}`);
    if (task.rewardNote) details.push(`🎁 Reward: ${task.rewardNote}`);
    Alert.alert(task.title, details.join('\n\n') || 'No additional details', options);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    return t.status === filter;
  });

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'effort') return (effortOrder[a.effort] ?? 2) - (effortOrder[b.effort] ?? 2);
    if (sortBy === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const stats = getTaskStats(tasks);
  const completionPct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
  const maxStat = Math.max(stats.pending, stats.inProgress, stats.done, stats.overdue, 1);

  // Category breakdown
  const categoryBreakdown = {};
  tasks.forEach(t => {
    const cat = CATEGORIES.find(c => c.key === t.category);
    const label = cat ? cat.icon + ' ' + (cat.label?.replace(cat.icon + ' ', '') || '') : '📋 Other';
    categoryBreakdown[label] = (categoryBreakdown[label] || 0) + 1;
  });
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxCatVal = topCategories.length > 0 ? Math.max(...topCategories.map(c => c[1]), 1) : 1;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Busy Bee! 🐝';
    if (hour < 17) return 'Good afternoon, Worker Bee! 🍯';
    return 'Good evening, Honey! 🌙';
  };

  const getMoodMessage = () => {
    if (stats.overdue > 0) return NAGGING_MESSAGES[Math.floor(Math.random() * NAGGING_MESSAGES.length)];
    if (stats.pending === 0 && stats.inProgress === 0) return "The hive is spotless! You're a legend! 🏆";
    if (stats.completedThisWeek >= 5) return "You've been a busy bee this week! 💪";
    return `${stats.pending + stats.inProgress} task${stats.pending + stats.inProgress !== 1 ? 's' : ''} buzzing around. Let's go! 🐝`;
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Greeting Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.moodMessage}>{getMoodMessage()}</Text>
          </View>
          <Text style={{ fontSize: 42 }}>🐝</Text>
        </View>
      </View>

      {/* Dashboard Cards */}
      <View style={styles.dashRow}>
        {/* Completion Ring */}
        <View style={styles.dashCard}>
          <ProgressCircle percent={completionPct} />
          <Text style={styles.dashCardLabel}>Progress</Text>
        </View>

        {/* Weekly Stats */}
        <View style={[styles.dashCard, { flex: 1 }]}>
          <Text style={styles.dashCardTitle}>🍯 This Week</Text>
          <Text style={styles.bigNumber}>{stats.completedThisWeek}</Text>
          <Text style={styles.bigLabel}>tasks completed</Text>
          {stats.averageRating > 0 && (
            <Text style={styles.ratingText}>{stats.averageRating.toFixed(1)} ⭐ avg rating</Text>
          )}
        </View>
      </View>

      {/* Status Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📊 Task Status</Text>
        <AnimatedBar label="📋 To Do" value={stats.pending} maxValue={maxStat} color={COLORS.statusPending} delay={0} />
        <AnimatedBar label="🔨 On It" value={stats.inProgress} maxValue={maxStat} color={COLORS.statusInProgress} delay={100} />
        <AnimatedBar label="✅ Done" value={stats.done} maxValue={maxStat} color={COLORS.statusDone} delay={200} />
        <AnimatedBar label="🔥 Overdue" value={stats.overdue} maxValue={maxStat} color={COLORS.danger} delay={300} />
      </View>

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🌻 Top Categories</Text>
          {topCategories.map(([label, count], i) => (
            <View key={i} style={styles.catRow}>
              <Text style={styles.catLabel}>{label}</Text>
              <View style={styles.catTrack}>
                <View style={[styles.catFill, { width: `${(count / maxCatVal) * 100}%` }]} />
              </View>
              <Text style={styles.catCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sort & Filter */}
      <View style={styles.controlsWrap}>
        {/* Sort selector */}
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={styles.sortButtonText}>
              Sort: {SORT_OPTIONS.find(s => s.key === sortBy)?.label} ▾
            </Text>
          </TouchableOpacity>

          {showSortMenu && (
            <View style={styles.sortDropdown}>
              {SORT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sortOption, sortBy === s.key && styles.sortOptionActive]}
                  onPress={() => { setSortBy(s.key); setShowSortMenu(false); }}
                >
                  <Text style={[styles.sortOptionText, sortBy === s.key && styles.sortOptionTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? tasks.length
              : f.key === 'overdue' ? stats.overdue
              : tasks.filter(t => t.status === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, filter === f.key && styles.badgeActive]}>
                    <Text style={[styles.badgeText, filter === f.key && styles.badgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.taskCount}>
        {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
        {filter !== 'all' ? ` · ${FILTERS.find(f => f.key === filter)?.label}` : ''}
      </Text>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <Text style={{ fontSize: 50 }}>{filter === 'all' ? '🐝' : filter === 'done' ? '😅' : '🍯'}</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'The hive is empty!' : filter === 'done' ? 'Nothing done yet...' : 'Nothing here!'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? "No tasks yet! Go add some from the Honey-Do tab! 🐝"
          : filter === 'done'
          ? 'Time to get buzzing! 🐝'
          : 'Looking good in this category!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={handleTaskPress} onStatusChange={handleStatusChange} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  moodMessage: { fontSize: 13, color: COLORS.white + 'CC', marginTop: 4 },

  // Dashboard cards
  dashRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: -8, gap: 10,
  },
  dashCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  dashCardLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 8, fontWeight: '600' },
  dashCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  bigNumber: { fontSize: 42, fontWeight: '900', color: COLORS.secondary },
  bigLabel: { fontSize: 12, color: COLORS.textLight },
  ratingText: { fontSize: 12, color: COLORS.honey, fontWeight: '600', marginTop: 4 },

  // Charts
  chartCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },

  // Categories
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontSize: 13, width: 90 },
  catTrack: { flex: 1, height: 14, backgroundColor: COLORS.textMuted + '18', borderRadius: 7, overflow: 'hidden', marginHorizontal: 8 },
  catFill: { height: '100%', backgroundColor: COLORS.honey, borderRadius: 7 },
  catCount: { fontSize: 13, fontWeight: '700', color: COLORS.text, width: 24, textAlign: 'right' },

  // Controls
  controlsWrap: { marginHorizontal: 16, marginTop: 14 },
  sortButton: {
    backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  sortButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  sortDropdown: {
    position: 'absolute', top: 44, left: 0, width: 200, zIndex: 20,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  sortOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  sortOptionActive: { backgroundColor: COLORS.primary + '18' },
  sortOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sortOptionTextActive: { color: COLORS.secondary },

  // Filters
  filterRow: {
    flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary,
  },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  filterLabelActive: { color: COLORS.secondary, fontWeight: '700' },
  badge: {
    backgroundColor: COLORS.textMuted + '30', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center',
  },
  badgeActive: { backgroundColor: COLORS.secondary },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  badgeTextActive: { color: COLORS.white },

  taskCount: {
    fontSize: 12, color: COLORS.textMuted, fontWeight: '600',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
  },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
