import { db } from '../firebase';
import { ref, push, set, update, remove, get, onValue } from 'firebase/database';

const TASKS_REF = 'tasks';

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const createTask = ({
  title,
  description = '',
  category = 'other',
  priority = 'medium',
  room = 'Other',
  effort = 'medium',
  dueDate = null,
  photo = null,
  toolsNeeded = '',
  suppliesNeeded = '',
  nagEnabled = true,
  rewardNote = '',
}) => ({
  title,
  description,
  category,
  priority,
  room,
  effort,
  dueDate,
  photo,
  toolsNeeded,
  suppliesNeeded,
  nagEnabled,
  rewardNote,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: null,
  completedAt: null,
  notes: '',
  rating: null,
});

// Load all tasks once (for pull-to-refresh, etc.)
export const loadTasks = async () => {
  try {
    const snapshot = await get(ref(db, TASKS_REF));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, task]) => ({ ...task, id }));
  } catch (e) {
    console.error('Failed to load tasks', e);
    return [];
  }
};

// Subscribe to real-time task updates - returns unsubscribe function
export const subscribeTasks = (callback) => {
  const tasksRef = ref(db, TASKS_REF);
  const unsubscribe = onValue(tasksRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const tasks = Object.entries(data).map(([id, task]) => ({ ...task, id }));
    callback(tasks);
  }, (error) => {
    console.error('Failed to subscribe to tasks', error);
    callback([]);
  });
  return unsubscribe;
};

export const addTask = async (taskData) => {
  try {
    const task = createTask(taskData);
    const newRef = push(ref(db, TASKS_REF));
    await set(newRef, task);
    return { ...task, id: newRef.key };
  } catch (e) {
    console.error('Failed to add task', e);
    return null;
  }
};

export const updateTask = async (id, updates) => {
  try {
    const taskRef = ref(db, `${TASKS_REF}/${id}`);
    await update(taskRef, { ...updates, updatedAt: new Date().toISOString() });
    return { id, ...updates };
  } catch (e) {
    console.error('Failed to update task', e);
    return null;
  }
};

export const deleteTask = async (id) => {
  try {
    await remove(ref(db, `${TASKS_REF}/${id}`));
  } catch (e) {
    console.error('Failed to delete task', e);
  }
};

export const getTaskStats = (tasks) => {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== 'done' || !t.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.completedAt) > weekAgo;
  }).length;

  const averageRating =
    tasks.filter((t) => t.rating).reduce((sum, t) => sum + t.rating, 0) /
      (tasks.filter((t) => t.rating).length || 1);

  return { total, pending, inProgress, done, overdue, completedThisWeek, averageRating };
};
