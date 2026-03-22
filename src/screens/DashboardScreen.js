import React, { useState, useCallback, useRef } from 'react';
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

// Simple status bar (no animation - plain View)
function StatusBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <View style={sb.row}>
      <Text style={sb.label}>{label}</Text>
      <View style={sb.track}>
        <View style={[sb.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={sb.value}>{value}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 13, color: COLORS.textLight, width: 80, fontWeight: '500' },
  track: { flex: 1, height: 18, backgroundColor: COLORS.textMuted + '18', borderRadius: 9, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 9 },
  value: { fontSize: 15, fontWeight: '800', color: COLORS.text, width: 28, textAlign: 'right' },
});

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchTasks = useCallback(async () => {
    const loaded = await loadTasks();
    setTasks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
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
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const maxStat = Math.max(stats.pending, stats.inProgress, stats.done, stats.overdue, 1);

  // Category breakdown
  const catMap = {};
  tasks.forEach(t => {
    const cat = CATEGORIES.find(c => c.key === t.category);
    const key = cat ? cat.key : 'other';
    const label = cat ? cat.icon + ' ' + cat.label.replace(cat.icon + ' ', '') : '📋 Other';
    if (!catMap[key]) catMap[key] = { label, count: 0 };
    catMap[key].count++;
  });
  const topCats = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 4);
  const maxCat = topCats.length > 0 ? Math.max(...topCats.map(c => c.count)) : 1;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Busy Bee!';
    if (hour < 17) return 'Good afternoon, Worker Bee!';
    return 'Good evening, Honey!';
  };

  const getMoodMessage = () => {
    if (stats.overdue > 0) return NAGGING_MESSAGES[Math.floor(Math.random() * NAGGING_MESSAGES.length)];
    if (stats.pending === 0 && stats.inProgress === 0) return "The hive is spotless! 🏆";
    if (stats.completedThisWeek >= 5) return "Busy bee this week! 💪";
    const count = stats.pending + stats.inProgress;
    return `${count} task${count !== 1 ? 's' : ''} buzzing around 🐝`;
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.moodMsg}>{getMoodMessage()}</Text>
          </View>
          <Text style={{ fontSize: 40 }}>🐝</Text>
        </View>
      </View>

      {/* Stats summary row */}
      <View style={s.statsRow}>
        <View style={[s.statBox, { borderTopColor: COLORS.statusPending }]}>
          <Text style={s.statIcon}>📋</Text>
          <Text style={[s.statNum, { color: COLORS.statusPending }]}>{stats.pending}</Text>
          <Text style={s.statLabel}>To Do</Text>
        </View>
        <View style={[s.statBox, { borderTopColor: COLORS.statusInProgress }]}>
          <Text style={s.statIcon}>🔨</Text>
          <Text style={[s.statNum, { color: COLORS.statusInProgress }]}>{stats.inProgress}</Text>
          <Text style={s.statLabel}>On It</Text>
        </View>
        <View style={[s.statBox, { borderTopColor: COLORS.statusDone }]}>
          <Text style={s.statIcon}>✅</Text>
          <Text style={[s.statNum, { color: COLORS.statusDone }]}>{stats.done}</Text>
          <Text style={s.statLabel}>Done</Text>
        </View>
        <View style={[s.statBox, { borderTopColor: COLORS.danger }]}>
          <Text style={s.statIcon}>🔥</Text>
          <Text style={[s.statNum, { color: COLORS.danger }]}>{stats.overdue}</Text>
          <Text style={s.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Progress + Weekly row */}
      <View style={s.cardsRow}>
        {/* Completion */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🍯 Progress</Text>
          <View style={s.progressRing}>
            <Text style={s.progressPct}>{completionPct}%</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${completionPct}%` }]} />
          </View>
          <Text style={s.progressLabel}>{stats.done} of {stats.total} tasks done</Text>
        </View>

        {/* Weekly */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🌻 This Week</Text>
          <Text style={s.bigNum}>{stats.completedThisWeek}</Text>
          <Text style={s.bigLabel}>completed</Text>
          {stats.averageRating > 0 && (
            <Text style={s.rating}>{stats.averageRating.toFixed(1)} ⭐</Text>
          )}
        </View>
      </View>

      {/* Status chart */}
      <View style={s.chartBox}>
        <Text style={s.cardTitle}>📊 Status Breakdown</Text>
        <StatusBar label="📋 To Do" value={stats.pending} maxValue={maxStat} color={COLORS.statusPending} />
        <StatusBar label="🔨 On It" value={stats.inProgress} maxValue={maxStat} color={COLORS.statusInProgress} />
        <StatusBar label="✅ Done" value={stats.done} maxValue={maxStat} color={COLORS.statusDone} />
        <StatusBar label="🔥 Overdue" value={stats.overdue} maxValue={maxStat} color={COLORS.danger} />
      </View>

      {/* Category breakdown */}
      {topCats.length > 0 && (
        <View style={s.chartBox}>
          <Text style={s.cardTitle}>🌸 Top Categories</Text>
          {topCats.map((cat, i) => (
            <View key={i} style={s.catRow}>
              <Text style={s.catLabel}>{cat.label}</Text>
              <View style={s.catTrack}>
                <View style={[s.catFill, { width: `${(cat.count / maxCat) * 100}%` }]} />
              </View>
              <Text style={s.catCount}>{cat.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sort button */}
      <View style={s.controlsArea}>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity style={s.sortBtn} onPress={() => setShowSortMenu(!showSortMenu)}>
            <Text style={s.sortBtnText}>
              Sort: {SORT_OPTIONS.find(o => o.key === sortBy)?.label} ▾
            </Text>
          </TouchableOpacity>
          {showSortMenu && (
            <View style={s.sortDrop}>
              {SORT_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.key}
                  style={[s.sortOpt, sortBy === o.key && s.sortOptActive]}
                  onPress={() => { setSortBy(o.key); setShowSortMenu(false); }}
                >
                  <Text style={[s.sortOptText, sortBy === o.key && s.sortOptTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Filters */}
        <View style={s.filterRow}>
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? tasks.length
              : f.key === 'overdue' ? stats.overdue
              : tasks.filter(t => t.status === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, filter === f.key && s.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={{ fontSize: 13 }}>{f.icon}</Text>
                <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[s.fBadge, filter === f.key && s.fBadgeActive]}>
                    <Text style={[s.fBadgeText, filter === f.key && s.fBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={s.taskCount}>
        {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
        {filter !== 'all' ? ` · ${FILTERS.find(f => f.key === filter)?.label}` : ''}
      </Text>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={s.emptyBox}>
      <Text style={{ fontSize: 50 }}>{filter === 'all' ? '🐝' : filter === 'done' ? '😅' : '🍯'}</Text>
      <Text style={s.emptyTitle}>
        {filter === 'all' ? 'The hive is empty!' : filter === 'done' ? 'Nothing done yet...' : 'Nothing here!'}
      </Text>
      <Text style={s.emptySub}>
        {filter === 'all' ? "Go add some tasks from the Honey-Do tab! 🐝" : filter === 'done' ? 'Time to get buzzing! 🐝' : 'This category is clear!'}
      </Text>
    </View>
  );

  return (
    <View style={s.container}>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  moodMsg: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: 12, marginTop: -10, gap: 6,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 10,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },

  // Cards row
  cardsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, gap: 10 },
  card: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  progressRing: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 6, borderColor: COLORS.statusDone,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  progressPct: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  progressBar: {
    width: '100%', height: 8, backgroundColor: COLORS.textMuted + '25',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.statusDone, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
  bigNum: { fontSize: 40, fontWeight: '900', color: COLORS.secondary },
  bigLabel: { fontSize: 12, color: COLORS.textLight },
  rating: { fontSize: 12, color: COLORS.honey, fontWeight: '600', marginTop: 4 },

  // Chart
  chartBox: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontSize: 13, width: 100 },
  catTrack: { flex: 1, height: 14, backgroundColor: COLORS.textMuted + '18', borderRadius: 7, overflow: 'hidden', marginHorizontal: 8 },
  catFill: { height: '100%', backgroundColor: COLORS.honey, borderRadius: 7 },
  catCount: { fontSize: 13, fontWeight: '700', color: COLORS.text, width: 24, textAlign: 'right' },

  // Controls
  controlsArea: { marginHorizontal: 16, marginTop: 14 },
  sortBtn: {
    backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  sortBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  sortDrop: {
    position: 'absolute', top: 44, left: 0, width: 200, zIndex: 20,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  sortOpt: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  sortOptActive: { backgroundColor: COLORS.primary + '20' },
  sortOptText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sortOptTextActive: { color: COLORS.secondary, fontWeight: '700' },

  // Filters
  filterRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.card,
  },
  filterChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  filterTextActive: { color: COLORS.secondary, fontWeight: '700' },
  fBadge: {
    backgroundColor: COLORS.textMuted + '30', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center',
  },
  fBadgeActive: { backgroundColor: COLORS.secondary },
  fBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  fBadgeTextActive: { color: COLORS.white },

  taskCount: {
    fontSize: 12, color: COLORS.textMuted, fontWeight: '600',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
  },

  emptyBox: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginTop: 12 },
  emptySub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
});
