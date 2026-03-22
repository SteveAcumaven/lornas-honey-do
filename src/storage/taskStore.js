import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@honeydoo_tasks';

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
  id: generateId(),
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

export const loadTasks = async () => {
  try {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to load tasks', e);
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
};

export const addTask = async (taskData) => {
  const tasks = await loadTasks();
  const task = createTask(taskData);
  tasks.unshift(task);
  await saveTasks(tasks);
  return task;
};

export const updateTask = async (id, updates) => {
  const tasks = await loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
    await saveTasks(tasks);
    return tasks[index];
  }
  return null;
};

export const deleteTask = async (id) => {
  const tasks = await loadTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await saveTasks(filtered);
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
