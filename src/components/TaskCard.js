import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, CATEGORIES, EFFORT_LEVELS } from '../constants/theme';
import PriorityBadge from './PriorityBadge';

export default function TaskCard({ task, onPress, onStatusChange }) {
  const category = CATEGORIES.find((c) => c.key === task.category) || CATEGORIES[CATEGORIES.length - 1];
  const effort = EFFORT_LEVELS.find((e) => e.key === task.effort);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const statusColors = {
    pending: COLORS.statusPending,
    in_progress: COLORS.statusInProgress,
    done: COLORS.statusDone,
  };

  const statusLabels = {
    pending: 'To Do',
    in_progress: 'On It!',
    done: 'Done!',
  };

  const nextStatus = {
    pending: 'in_progress',
    in_progress: 'done',
    done: 'pending',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue!`;
    if (diffDays === 0) return 'Due today!';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return d.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, isOverdue && styles.cardOverdue, task.status === 'done' && styles.cardDone]}
      onPress={() => onPress?.(task)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, task.status === 'done' && styles.checkboxDone]}
          onPress={() => onStatusChange?.(task.id, task.status === 'done' ? 'pending' : 'done')}
        >
          {task.status === 'done' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, task.status === 'done' && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <Text style={styles.room}>{task.room} • {category.icon} {category.label?.replace(category.icon + ' ', '')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusColors[task.status] }]}
          onPress={() => onStatusChange?.(task.id, nextStatus[task.status])}
        >
          <Text style={styles.statusText}>{statusLabels[task.status]}</Text>
        </TouchableOpacity>
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <PriorityBadge priority={task.priority} />
        {effort && <Text style={styles.effort}>{effort.label.split(' ')[0]} {effort.label.split('(')[1]?.replace(')', '') || ''}</Text>}
        {task.dueDate && (
          <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
            {formatDate(task.dueDate)}
          </Text>
        )}
      </View>

      {task.rewardNote ? (
        <View style={styles.rewardRow}>
          <Text style={styles.rewardText}>🎁 {task.rewardNote}</Text>
        </View>
      ) : null}

      {isOverdue && task.nagEnabled && (
        <View style={styles.nagRow}>
          <Text style={styles.nagText}>
            {['😒', '⏰', '🤔', '👀', '📞', '😤', '🐝'][Math.floor(Math.random() * 7)]}{' '}
            Ahem... this was due already!
          </Text>
        </View>
      )}

      {/* Action buttons for incomplete tasks */}
      {task.status !== 'done' && (
        <View style={styles.actionRow}>
          {task.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onStatusChange?.(task.id, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>🔨 Start</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={() => onStatusChange?.(task.id, 'done')}
          >
            <Text style={[styles.actionButtonText, styles.doneButtonText]}>✅ Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  cardDone: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: COLORS.textMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.statusDone,
    borderColor: COLORS.statusDone,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  room: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  effort: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  dueDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 'auto',
  },
  dueDateOverdue: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  rewardRow: {
    marginTop: 8,
    backgroundColor: COLORS.accent + '33',
    padding: 8,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 12,
    color: COLORS.text,
  },
  nagRow: {
    marginTop: 8,
    backgroundColor: COLORS.danger + '15',
    padding: 8,
    borderRadius: 8,
  },
  nagText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.textMuted + '20',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.textMuted + '18',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  doneButton: {
    backgroundColor: COLORS.statusDone + '18',
  },
  doneButtonText: {
    color: COLORS.statusDone,
    fontWeight: '700',
  },
});
