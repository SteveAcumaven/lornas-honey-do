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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, ENCOURAGEMENT_MESSAGES, NAGGING_MESSAGES } from '../constants/theme';
import { loadTasks, updateTask, deleteTask, getTaskStats } from '../storage/taskStore';
import TaskCard from '../components/TaskCard';
import StatCard from '../components/StatCard';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To Do' },
  { key: 'in_progress', label: 'On It' },
  { key: 'done', label: 'Done' },
  { key: 'overdue', label: '🔥 Overdue' },
];

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchTasks = useCallback(async () => {
    const loaded = await loadTasks();
    setTasks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, [fetchTasks, fadeAnim, slideAnim])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'done') {
      const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      Alert.alert('Task Complete!', msg);
      await updateTask(id, { status: 'done', completedAt: new Date().toISOString() });
    } else if (newStatus === 'in_progress') {
      await updateTask(id, { status: 'in_progress', startedAt: new Date().toISOString() });
    } else {
      await updateTask(id, { status: newStatus });
    }
    fetchTasks();
  };

  const handleTaskPress = (task) => {
    const options = [
      { text: 'Cancel', style: 'cancel' },
    ];

    if (task.status !== 'done') {
      options.push({
        text: '✅ Mark Done',
        onPress: () => handleStatusChange(task.id, 'done'),
      });
    }

    if (task.status === 'pending') {
      options.push({
        text: '🔨 Start Working',
        onPress: () => handleStatusChange(task.id, 'in_progress'),
      });
    }

    options.push({
      text: '🗑️ Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert('Delete Task?', 'Are you sure? She might notice...', [
          { text: 'Keep It', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteTask(task.id);
              fetchTasks();
            },
          },
        ]);
      },
    });

    const details = [];
    if (task.description) details.push(`📝 ${task.description}`);
    if (task.toolsNeeded) details.push(`🔧 Tools: ${task.toolsNeeded}`);
    if (task.suppliesNeeded) details.push(`🛒 Supplies: ${task.suppliesNeeded}`);
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
    if (sortBy === 'priority') {
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    }
    if (sortBy === 'date') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const stats = getTaskStats(tasks);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Busy Bee! 🐝';
    if (hour < 17) return 'Good afternoon, Worker Bee! 🍯';
    return 'Good evening, Honey! 🌙';
  };

  const getMoodMessage = () => {
    if (stats.overdue > 0) {
      const nag = NAGGING_MESSAGES[Math.floor(Math.random() * NAGGING_MESSAGES.length)];
      return nag;
    }
    if (stats.pending === 0 && stats.inProgress === 0) {
      return "All caught up! You're a legend! 🏆";
    }
    if (stats.completedThisWeek >= 5) {
      return "You've been crushing it this week! 💪";
    }
    return `You've got ${stats.pending + stats.inProgress} task${stats.pending + stats.inProgress !== 1 ? 's' : ''} waiting. Let's go! 🚀`;
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Greeting Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.moodMessage}>{getMoodMessage()}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="📋" value={stats.pending} label="To Do" color={COLORS.statusPending} />
        <StatCard icon="🔨" value={stats.inProgress} label="In Progress" color={COLORS.statusInProgress} />
        <StatCard icon="✅" value={stats.done} label="Done" color={COLORS.statusDone} />
        <StatCard icon="🔥" value={stats.overdue} label="Overdue" color={COLORS.danger} />
      </View>

      {/* Weekly Score */}
      <View style={styles.weeklyCard}>
        <Text style={styles.weeklyTitle}>This Week's Score</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyNumber}>{stats.completedThisWeek}</Text>
            <Text style={styles.weeklyLabel}>Completed</Text>
          </View>
          <View style={styles.weeklyDivider} />
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyNumber}>
              {stats.averageRating ? `${stats.averageRating.toFixed(1)}⭐` : 'N/A'}
            </Text>
            <Text style={styles.weeklyLabel}>Avg Rating</Text>
          </View>
          <View style={styles.weeklyDivider} />
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyNumber}>
              {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
            </Text>
            <Text style={styles.weeklyLabel}>Complete</Text>
          </View>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {[
          { key: 'priority', label: 'Priority' },
          { key: 'date', label: 'Newest' },
          { key: 'due', label: 'Due Date' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
            onPress={() => setSortBy(s.key)}
          >
            <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
              {f.key === 'overdue' && stats.overdue > 0 ? ` (${stats.overdue})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>
        {filter === 'all' ? '🎉' : filter === 'done' ? '😅' : '🛋️'}
      </Text>
      <Text style={styles.emptyTitle}>
        {filter === 'all'
          ? 'No tasks yet!'
          : filter === 'done'
          ? 'Nothing done yet...'
          : "Nothing here!"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? "Enjoy it while it lasts... she hasn't found the app yet! 😂"
          : filter === 'done'
          ? 'Time to get to work, buddy! 💪'
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
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
  },
  moodMessage: {
    fontSize: 14,
    color: COLORS.white + 'CC',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: -12,
    paddingTop: 0,
  },
  weeklyCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  weeklyLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  weeklyDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.textMuted + '40',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.textMuted + '30',
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },
  sortChipActive: {
    backgroundColor: COLORS.secondary,
  },
  sortChipText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  sortChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
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
