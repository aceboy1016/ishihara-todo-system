// Task Management Types
export interface Task {
  id: number;
  category: 'note' | 'standfm' | 'instagram' | 'youtube' | 'expertise' | 'marketing' | 'business' | 'topform' | 'private' | 'other' | 'reading';
  title: string;
  priority: 'S' | 'A' | 'B';
  energy: 'high' | 'medium' | 'low';
  completed: boolean;
  completedDate: string | null;
  estimatedHours: number;
  actualHours?: number;
  notes?: string;
  readingStatus?: 'reading' | 'completed'; // 読書専用の状態
  scheduledDate?: string; // 予定日（YYYY-MM-DD形式）
  isRecurring?: boolean; // 繰り返しタスクかどうか
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // 繰り返しタイプ
  recurringInterval?: number; // 繰り返し間隔（例：2週間おき）
  rolloverFrom?: string; // 繰り越し元の日付（YYYY-MM-DD形式）
  createdAt: string;
  updatedAt: string;
}

// Goal Management Types
export interface CategoryGoals {
  note: CategoryGoal;
  standfm: CategoryGoal;
  instagram: CategoryGoal;
  youtube: CategoryGoal;
  expertise: CategoryGoal;
  marketing: CategoryGoal;
  business: CategoryGoal;
  topform: CategoryGoal;
  reading: CategoryGoal;
}

export interface CategoryGoal {
  target: number | string;
  current: number | string;
  label: string;
  unit?: string;
}

// Phase Management Types
export interface PhaseProgress {
  overall: number;
  methodology: number;
  onlinePlatform: number;
  revenue: number;
}

// Weekly Data Structure
export interface WeekData {
  weekNumber: number;
  dateRange: string;
  phase: number;
  phaseProgress: PhaseProgress;
  tasks: Task[];
  goals: CategoryGoals;
  insights: string[];
  weeklyReflection: string;
  createdAt: string;
  updatedAt: string;
}

export type ReflectionMood = 'low' | 'neutral' | 'high';
export type ReflectionEnergy = 'depleted' | 'balanced' | 'charged';

export interface WeeklyReflectionInput {
  wins: string;
  challenges: string;
  learnings: string;
  mood: ReflectionMood;
  energy: ReflectionEnergy;
  focusNextWeek: string;
  notes: string;
}

export interface WeeklyMetricsSnapshot {
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  highPriorityCompleted: number;
  categoryProgress: Record<keyof CategoryGoals, number>;
  energyDistribution: Record<'high' | 'medium' | 'low', number>;
  priorityDistribution: Record<'S' | 'A' | 'B', number>;
  createdAt: string;
}

export interface AIInsight {
  summary: string;
  focusAreas: string[];
  recommendations: string[];
  encouragement: string;
  energyAdvice: string;
  generatedAt: string;
  engine: 'rule-based' | 'openai';
}

export interface AIInsightRequest {
  profile: {
    persona: 'INTJ' | 'INTP' | 'INFJ' | 'ENTJ' | 'custom';
    tone: 'direct' | 'supportive' | 'balanced';
  };
  metrics: WeeklyMetricsSnapshot;
  reflection: WeeklyReflectionInput;
  tasks: Task[];
}

export interface WeekHistoryEntry {
  id: string;
  weekNumber: number;
  year: number;
  dateRange: string;
  metrics: WeeklyMetricsSnapshot;
  reflection: WeeklyReflectionInput;
  aiInsight?: AIInsight;
  createdAt: string;
}

export interface ReflectionProfile {
  persona: 'INTJ' | 'INTP' | 'INFJ' | 'ENTJ' | 'custom';
  customPersona?: string;
  tone: 'direct' | 'supportive' | 'balanced';
  openAIApiKey?: string;
  preferredModel?: string;
  allowRuleFallback?: boolean;
  lastUpdated: string;
}

// Dynamic Category System
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  goal: {
    type: 'number' | 'text' | 'percentage';
    target: any;
    current: any;
    unit?: string;
  };
  editable: boolean;
}

// Analytics Types
export interface AnalyticsData {
  learningEfficiency: number;
  systemBuildingProgress: number;
  energyOptimization: number;
  strategicAlignment: number;
  performancePattern: PerformancePattern;
  energyPattern: EnergyPattern;
  weeklyTrend: WeeklyTrend[];
}

export interface PerformancePattern {
  averageCompletionRate: number;
  bestPerformingCategory: string;
  weakestCategory: string;
  improvementTrend: number;
}

export interface EnergyPattern {
  highEnergyTasksCompleted: number;
  optimalEnergySchedule: string[];
  energyEfficiencyScore: number;
}

export interface WeeklyTrend {
  weekNumber: number;
  completionRate: number;
  priorityTasksCompleted: number;
  totalTasks: number;
}

// Insight Generation Types
export interface InsightData {
  performancePattern: string[];
  energyOptimization: string[];
  strategicAlignment: string[];
  systemBuilding: string[];
  recommendations: string[];
}

// UI State Management Types
export interface UIState {
  selectedWeek: number;
  viewMode: 'dashboard' | 'analytics' | 'history';
  taskFilters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

export interface TaskFilters {
  category?: 'sns' | 'expertise' | 'marketing' | 'business' | 'topform' | 'private' | 'other';
  priority?: 'S' | 'A' | 'B';
  energy?: 'high' | 'medium' | 'low';
  completed?: boolean;
}

// Form Types
export interface TaskFormData {
  title: string;
  category: 'note' | 'standfm' | 'instagram' | 'youtube' | 'expertise' | 'marketing' | 'business' | 'topform' | 'private' | 'other' | 'reading';
  priority: 'S' | 'A' | 'B';
  energy: 'high' | 'medium' | 'low';
  estimatedHours: number;
  notes?: string;
  scheduledDate?: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringInterval?: number;
}

export interface GoalFormData {
  category: string;
  target: number | string;
  current: number | string;
  label: string;
  unit?: string;
}

// Export/Import Types
export interface ExportData {
  version: string;
  exportDate: string;
  weekData: WeekData[];
  categories: Category[];
  analytics: AnalyticsData;
}

// Error Handling Types
export interface AppError {
  type: 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'IMPORT_ERROR' | 'CALCULATION_ERROR';
  message: string;
  details?: any;
  timestamp: string;
}

// Hook Return Types
export interface UseLocalStorageReturn<T> {
  data: T | null;
  setData: (data: T) => void;
  clearData: () => void;
  isLoading: boolean;
  error: AppError | null;
}

export interface UseAnalyticsReturn {
  analytics: AnalyticsData | null;
  calculateAnalytics: (weekData: WeekData[]) => AnalyticsData;
  generateInsights: (weekData: WeekData[]) => InsightData;
  isCalculating: boolean;
}

export interface UseTasksReturn {
  tasks: Task[];
  addTask: (taskData: TaskFormData) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  toggleTask: (id: number) => void;
  moveTask: (taskId: number, newCategory: string) => void;
  reorderTasks: (tasks: Task[]) => void;
}

export interface UseGoalsReturn {
  goals: CategoryGoals;
  updateGoal: (category: keyof CategoryGoals, goal: Partial<CategoryGoal>) => void;
  addCategory: (category: Category) => void;
  removeCategory: (categoryId: string) => void;
  calculateProgress: (category: keyof CategoryGoals) => number;
}

// Long-term Goals Types
export interface PhaseGoal {
  id: string;
  title: string;
  target?: string;
  description: string;
  isAchieved: boolean;
}

export interface LongTermPhase {
  id: string;
  title: string;
  period: string;
  description: string;
  goals: PhaseGoal[];
  currentPhase: boolean;
}

export interface LongTermGoals {
  phases: LongTermPhase[];
  lastUpdated: string;
}

// Constants Types
export interface Constants {
  CATEGORIES: Record<string, Category>;
  PRIORITY_WEIGHTS: Record<string, number>;
  ENERGY_MULTIPLIERS: Record<string, number>;
  PHASE_THRESHOLDS: number[];
  LOCAL_STORAGE_KEYS: Record<string, string>;
}

// Component Props Types
export interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onMove: (taskId: number, newCategory: string) => void;
  isDragging?: boolean;
}

export interface TaskCategoryProps {
  category: keyof CategoryGoals;
  tasks: Task[];
  onAddTask: () => void;
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskMove: (taskId: number, newCategory: string) => void;
}

export interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  trend?: number;
  color?: string;
}

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  icon?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}