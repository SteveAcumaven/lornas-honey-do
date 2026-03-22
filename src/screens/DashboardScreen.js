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
  { key: 'priority', label: '🚨 Priority', desc: 'Most urgent first' },
  { key: 'date', label: '🆕 Newest', desc: 'Recently added' },
  { key: 'due', label: '📅 Due Date', desc: 'Soonest due first' },
  { key: 'effort', label: '💪 Effort', desc: 'Quick wins first' },
];

const effortOrder = { quick: 0, easy: 1, medium: 2, hard: 3, project: 4 };

// Mini bar chart component
const MiniBarChart = ({ data, height = 50 }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(80, animValues.map((anim, i) =>
      Animated.timing(anim, {
        toValue: data[i].value / maxVal,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      })
    )).start();
  }, [data]);

  return (
    <View style={[barStyles.container, { height }]}>
      {data.map((d, i) => (
        <View key={i} style={barStyles.barGroup}>
          <Animated.View
            style={[
              barStyles.bar,
              {
                backgroundColor: d.color,
                height: animValues[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, height - 16],
                }),
              },
            ]}
          />
          <Text style={barStyles.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};

const barStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 8 },
  barGroup: { alignItems: 'center', flex: 1 },
  bar: { width: 24, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 9, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
});

// Circular progress ring
const ProgressRing = ({ percent, size = 80, strokeWidth = 8, color = COLORS.success }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const circumference = Math.PI * (size - strokeWidth);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percent,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: COLORS.textMuted + '20',
      }} />
      {/* Animated fill ring */}
      <Animated.View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderTopColor: color,
        borderRightColor: animValue.interpolate({ inputRange: [0, 25, 50, 75, 100], outputRange: ['transparent', color, color, color, color] }),
        borderBottomColor: animValue.interpolate({ inputRange: [0, 50, 100], outputRange: ['transparent', 'transparent', color] }),
        borderLeftColor: animValue.interpolate({ inputRange: [0, 75, 100], outputRange: ['transparent', 'transparent', color] }),
        transform: [{ rotate: '-90deg' }],
      }} />
      {/* Center text */}
      <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{Math.round(percent)}%</Text>
      <Text style={{ fontSize: 9, color: COLORS.textLight }}>Done</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchTasks = useCallback(async () => {
    const loaded = await loadTasks();
    setTasks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1)), useNativeDriver: true }),
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

  // Category breakdown
  const categoryBreakdown = {};
  tasks.forEach(t => {
    const cat = CATEGORIES.find(c => c.key === t.category);
    const label = cat ? cat.icon : '📋';
    categoryBreakdown[label] = (categoryBreakdown[label] || 0) + 1;
  });
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, color: COLORS.honey }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Busy Bee!';
    if (hour < 17) return 'Good afternoon, Worker Bee!';
    return 'Good evening, Honey!';
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
        <View style={styles.headerTop}>
          <View style={styles.headerTextArea}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.moodMessage}>{getMoodMessage()}</Text>
          </View>
          <Text style={styles.headerBee}>🐝</Text>
        </View>
      </View>

      {/* Dashboard Cards Row */}
      <View style={styles.dashboardRow}>
        {/* Completion Ring */}
        <View style={styles.ringCard}>
          <ProgressRing percent={completionPct} />
          <Text style={styles.ringLabel}>Completion</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: '📋', value: stats.pending, label: 'To Do', color: COLORS.statusPending },
            { icon: '🔨', value: stats.inProgress, label: 'In Progress', color: COLORS.statusInProgress },
            { icon: '✅', value: stats.done, label: 'Done', color: COLORS.statusDone },
            { icon: '🔥', value: stats.overdue, label: 'Overdue', color: COLORS.danger },
          ].map((s, i) => (
            <View key={i} style={styles.miniStat}>
              <View style={[styles.miniStatDot, { backgroundColor: s.color }]} />
              <Text style={styles.miniStatValue}>{s.value}</Text>
              <Text style={styles.miniStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Charts Row */}
      <View style={styles.chartsRow}>
        {/* Status Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Status Overview</Text>
          <MiniBarChart
            data={[
              { label: 'To Do', value: stats.pending, color: COLORS.statusPending },
              { label: 'On It', value: stats.inProgress, color: COLORS.statusInProgress },
              { label: 'Done', value: stats.done, color: COLORS.statusDone },
              { label: 'Late', value: stats.overdue, color: COLORS.danger },
            ]}
            height={70}
          />
        </View>

        {/* Weekly Activity */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>This Week</Text>
          <View style={styles.weeklyMini}>
            <Text style={styles.weeklyBigNumber}>{stats.completedThisWeek}</Text>
            <Text style={styles.weeklyBigLabel}>tasks done</Text>
            {stats.averageRating > 0 && (
              <Text style={styles.weeklyRating}>{stats.averageRating.toFixed(1)} ⭐ avg</Text>
            )}
          </View>
        </View>
      </View>

      {/* Category breakdown if tasks exist */}
      {topCategories.length > 0 && (
        <View style={styles.categoryCard}>
          <Text style={styles.chartTitle}>Top Categories</Text>
          <View style={styles.categoryBars}>
            {topCategories.map((cat, i) => {
              const maxCat = Math.max(...topCategories.map(c => c.value), 1);
              return (
                <View key={i} style={styles.categoryRow}>
                  <Text style={styles.categoryEmoji}>{cat.label}</Text>
                  <View style={styles.categoryBarBg}>
                    <Animated.View style={[styles.categoryBarFill, { width: `${(cat.value / maxCat) * 100}%` }]} />
                  </View>
                  <Text style={styles.categoryCount}>{cat.value}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Sort & Filter Controls */}
      <View style={styles.controlsSection}>
        {/* Sort */}
        <View style={styles.sortSection}>
          <TouchableOpacity style={styles.sortTrigger} onPress={() => setShowSortMenu(!showSortMenu)}>
            <Text style={styles.sortTriggerText}>
              {SORT_OPTIONS.find(s => s.key === sortBy)?.label || 'Sort'} ▾
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
                  <Text style={[styles.sortOptionText, sortBy === s.key && styles.sortOptionTextActive]}>{s.label}</Text>
                  <Text style={styles.sortOptionDesc}>{s.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Filters */}
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
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Task count */}
      <Text style={styles.taskCount}>
        {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
        {filter !== 'all' ? ` (${filter.replace('_', ' ')})` : ''}
      </Text>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>
        {filter === 'all' ? '🐝' : filter === 'done' ? '😅' : '🍯'}
      </Text>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'The hive is empty!' : filter === 'done' ? 'Nothing done yet...' : 'Nothing here!'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? "No tasks yet! Lorna hasn't found the app yet! 😂"
          : filter === 'done'
          ? 'Time to get buzzing, buddy! 🐝'
          : 'This category is clear!'}
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
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  // Header
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextArea: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  moodMessage: {
    fontSize: 13,
    color: COLORS.white + 'CC',
    marginTop: 4,
  },
  headerBee: {
    fontSize: 40,
  },

  // Dashboard cards
  dashboardRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -10,
    gap: 10,
  },
  ringCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ringLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    fontWeight: '600',
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniStat: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  miniStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  miniStatLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    flex: 1,
  },

  // Charts
  chartsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  chartCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  weeklyMini: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  weeklyBigNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  weeklyBigLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  weeklyRating: {
    fontSize: 12,
    color: COLORS.honey,
    fontWeight: '600',
    marginTop: 4,
  },

  // Category
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryBars: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  categoryBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.textMuted + '18',
    borderRadius: 7,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: COLORS.honey,
    borderRadius: 7,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    width: 24,
    textAlign: 'right',
  },

  // Controls
  controlsSection: {
    marginTop: 14,
    marginHorizontal: 16,
  },
  sortSection: {
    marginBottom: 10,
    zIndex: 10,
  },
  sortTrigger: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sortTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sortDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sortOptionActive: {
    backgroundColor: COLORS.secondary + '12',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.secondary,
  },
  sortOptionDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: COLORS.secondary + '12',
    borderColor: COLORS.secondary,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: COLORS.textMuted + '30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.secondary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  filterBadgeTextActive: {
    color: COLORS.white,
  },
  taskCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
