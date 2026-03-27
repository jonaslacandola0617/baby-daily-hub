export type Category = 'sleep' | 'meal' | 'play' | 'care' | 'learn' | 'outdoor'
export type MilestoneStatus = 'done' | 'progress' | 'pending'
export type Mood = '😊' | '😐' | '😢' | '😤' | '🤒'

export interface RoutineItem {
  id: string
  timeStart: string
  timeEnd: string | null
  activity: string
  note: string | null
  category: Category
  order: number
}

export interface DailyTracker {
  id: string
  date: string
  sleepHours: number
  napHours: number
  waterCups: number
  diaperCount: number
  temperature: string | null
  weight: string | null
  medicine: string | null
  mood: string | null
}

export interface MealLog {
  id: string
  date: string
  breakfast: string | null
  lunch: string | null
  dinner: string | null
  snacks: string | null
  vitamins: Record<string, boolean>
}

export interface Milestone {
  id: string
  text: string
  category: string
  status: MilestoneStatus
  order: number
}

export interface Note {
  id: string
  date: string
  dailyNotes: string | null
  parentNotes: string | null
}

export interface Appointment {
  id: string
  date: string
  text: string
  order: number
}

export interface BabyProfile {
  id: string
  name: string
  birthdate: string | null
}
