import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '../constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DatePicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  const today = new Date();
  const selected = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState(selected?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(d.toISOString());
    setVisible(false);
  };

  const isToday = (day) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day) =>
    selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(23, 59, 59);
    return d < today;
  };

  const formatDisplay = () => {
    if (!selected) return null;
    return selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View>
      <TouchableOpacity style={styles.inputButton} onPress={() => setVisible(true)}>
        {formatDisplay() ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedText}>{formatDisplay()}</Text>
            <TouchableOpacity onPress={() => { onChange(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.placeholder}>Tap to pick a date</Text>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            {/* Month/Year Header */}
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day names */}
            <View style={styles.dayNamesRow}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dayName}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayCell,
                    isToday(day) && styles.todayCell,
                    isSelected(day) && styles.selectedCell,
                  ]}
                  onPress={() => day && selectDay(day)}
                  disabled={!day}
                >
                  <Text style={[
                    styles.dayText,
                    !day && styles.emptyDay,
                    isPast(day) && styles.pastDay,
                    isToday(day) && styles.todayText,
                    isSelected(day) && styles.selectedDayText,
                  ]}>
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick options */}
            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickButton} onPress={() => selectDay(today.getDate())}>
                <Text style={styles.quickText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => {
                const tom = new Date(today);
                tom.setDate(tom.getDate() + 1);
                onChange(tom.toISOString());
                setVisible(false);
              }}>
                <Text style={styles.quickText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => {
                const week = new Date(today);
                week.setDate(week.getDate() + 7);
                onChange(week.toISOString());
                setVisible(false);
              }}>
                <Text style={styles.quickText}>Next Week</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputButton: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  placeholder: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.textMuted,
    paddingLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyDay: {
    color: 'transparent',
  },
  pastDay: {
    color: COLORS.textMuted,
  },
  todayCell: {
    backgroundColor: COLORS.accent + '50',
  },
  todayText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
  },
  quickText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
