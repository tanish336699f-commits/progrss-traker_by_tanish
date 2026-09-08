export type Domain = 'study' | 'skills';

export interface Activity {
  id?: number;
  date: string; // YYYY-MM-DD
  domain: Domain;
  category: string; // subject name or skill name
  activity: string;
  duration: number; // seconds
  notes?: string;
  createdAt: number; // timestamp
}

export type ChapterStatus = 'not-started' | 'in-progress' | 'completed';

export interface Subject {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Chapter {
  id?: number;
  subjectId: number;
  name: string;
  status: ChapterStatus;
  createdAt: number;
}

export interface Skill {
  id?: number;
  name: string;
  createdAt: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  id?: number;
  status: TimerStatus;
  domain: Domain;
  category: string;
  activity: string;
  startTimestamp: number | null;
  pausedAt: number | null;
  accumulatedTime: number; // seconds accumulated before current running segment
}

export interface Settings {
  id?: number;
  theme: 'light' | 'dark';
}

export type GoalStatus = 'pending' | 'completed' | 'missed';

export interface Goal {
  id?: number;
  title: string;
  domain: Domain | 'other';
  targetMinutes: number;
  date: string; // YYYY-MM-DD — the day the goal is for
  status: GoalStatus;
  createdAt: number;
  completedAt: number | null;
}
