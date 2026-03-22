export const COLORS = {
  primary: '#E91E8C',
  primaryDark: '#C4177A',
  primaryLight: '#F472B6',
  secondary: '#BE185D',
  secondaryDark: '#9D174D',
  accent: '#FBB6CE',
  background: '#FFF5F7',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  white: '#FFFFFF',
  danger: '#E53E3E',
  success: '#38A169',
  warning: '#ECC94B',
  info: '#74B9FF',

  priorityLow: '#38A169',
  priorityMedium: '#ECC94B',
  priorityHigh: '#E91E8C',
  priorityUrgent: '#9B2C2C',

  statusPending: '#74B9FF',
  statusInProgress: '#ECC94B',
  statusDone: '#38A169',
  statusOverdue: '#E53E3E',
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
  "I already asked you twice... 😒",
  "It's been a while, honey... ⏰",
  "Remember when you said you'd do this? 🤔",
  "The neighbors got theirs done already 👀",
  "I could call a handyman... just saying 📞",
  "Still waiting... patiently... mostly... 😤",
  "This isn't going to fix itself! 🛠️",
];

export const ENCOURAGEMENT_MESSAGES = [
  "You're the best! 🏆",
  "My hero! 💪",
  "That's why I married you! 💕",
  "Gold star for you! ⭐",
  "Honey Do champion! 🎉",
  "Look at you being handy! 🔨",
  "Task master! You're on fire! 🔥",
];
