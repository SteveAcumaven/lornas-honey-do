export const COLORS = {
  primary: '#C47F17',
  primaryDark: '#A3691A',
  primaryLight: '#E8A933',
  secondary: '#5C3317',
  secondaryDark: '#3E1F0D',
  accent: '#F5C542',
  honey: '#E8A933',
  honeycomb: '#DAA520',
  background: '#FFFBF0',
  card: '#FFFFFF',
  text: '#3E2723',
  textLight: '#6D4C41',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  danger: '#C62828',
  success: '#2E7D32',
  warning: '#E8A933',
  info: '#1565C0',

  priorityLow: '#2E7D32',
  priorityMedium: '#E8A933',
  priorityHigh: '#D84315',
  priorityUrgent: '#B71C1C',

  statusPending: '#1565C0',
  statusInProgress: '#E8A933',
  statusDone: '#2E7D32',
  statusOverdue: '#C62828',
};

export const PRIORITY_LEVELS = [
  { key: 'low', label: '😌 No Rush', color: COLORS.priorityLow },
  { key: 'medium', label: '🙂 When You Can', color: COLORS.priorityMedium },
  { key: 'high', label: '😤 Soon Please!', color: COLORS.priorityHigh },
  { key: 'urgent', label: '🔥 NOW, Honey!', color: COLORS.priorityUrgent },
];

export const CATEGORIES = [
  { key: 'plumbing', label: '🔧 Plumbing', icon: '🔧' },
  { key: 'electrical', label: '💡 Electrical', icon: '💡' },
  { key: 'yard', label: '🌿 Yard Work', icon: '🌿' },
  { key: 'cleaning', label: '🧹 Cleaning', icon: '🧹' },
  { key: 'painting', label: '🎨 Painting', icon: '🎨' },
  { key: 'furniture', label: '🪑 Furniture', icon: '🪑' },
  { key: 'appliance', label: '🔌 Appliance Repair', icon: '🔌' },
  { key: 'automotive', label: '🚗 Automotive', icon: '🚗' },
  { key: 'grocery', label: '🛒 Grocery/Errands', icon: '🛒' },
  { key: 'pet', label: '🐾 Pet Care', icon: '🐾' },
  { key: 'laundry', label: '👔 Laundry', icon: '👔' },
  { key: 'cooking', label: '🍳 Cooking', icon: '🍳' },
  { key: 'organizing', label: '📦 Organizing', icon: '📦' },
  { key: 'tech', label: '💻 Tech/IT', icon: '💻' },
  { key: 'other', label: '📋 Other', icon: '📋' },
];

export const ROOMS = [
  'Kitchen', 'Living Room', 'Bedroom', 'Bathroom',
  'Garage', 'Basement', 'Attic', 'Front Yard',
  'Back Yard', 'Laundry Room', 'Dining Room',
  'Home Office', 'Kids Room', 'Driveway', 'Other',
];

export const EFFORT_LEVELS = [
  { key: 'quick', label: '⚡ Quick Fix (< 15 min)', minutes: 15 },
  { key: 'easy', label: '👍 Easy (15-30 min)', minutes: 30 },
  { key: 'medium', label: '💪 Some Effort (30-60 min)', minutes: 60 },
  { key: 'hard', label: '😅 Big Job (1-3 hours)', minutes: 180 },
  { key: 'project', label: '🏗️ Project (3+ hours)', minutes: 300 },
];

export const NAGGING_MESSAGES = [
  "I already asked you twice, honey... 🐝",
  "The hive is getting impatient... ⏰",
  "Remember when you said you'd do this? 🍯",
  "The neighbors' bees got theirs done already 👀",
  "I could call a worker bee... just saying 📞",
  "Still buzzing... waiting... mostly... 😤",
  "This isn't going to fix itself, honey! 🐝",
];

export const ENCOURAGEMENT_MESSAGES = [
  "You're the bee's knees! 🐝",
  "My hero! Buzz buzz! 💛",
  "That's why you're my honey! 🍯",
  "Gold honeycomb for you! ⭐",
  "Queen Bee approves! 👑",
  "Look at you being a busy bee! 🐝",
  "The hive is proud! You're on fire! 🔥",
];
