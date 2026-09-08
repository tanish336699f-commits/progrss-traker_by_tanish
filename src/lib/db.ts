import Dexie, { type Table } from 'dexie';
import type { Activity, Subject, Chapter, Skill, TimerState, Settings } from './types';

export class ProgressDB extends Dexie {
  activities!: Table<Activity, number>;
  subjects!: Table<Subject, number>;
  chapters!: Table<Chapter, number>;
  skills!: Table<Skill, number>;
  timer!: Table<TimerState, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('progress-tracker');
    this.version(1).stores({
      activities: '++id, date, domain, category, createdAt',
      subjects: '++id, name',
      chapters: '++id, subjectId, status',
      skills: '++id, name',
      timer: '++id',
      settings: '++id',
    });
    this.version(2).stores({
      activities: '++id, date, domain, category, createdAt',
      subjects: '++id, name',
      chapters: '++id, subjectId, status',
      skills: '++id, name',
      timer: '++id',
      settings: '++id',
    }).upgrade(async () => {
      // Clean up any duplicate skills from earlier versions
      const allSkills = await db.skills.toArray();
      const seen = new Set<string>();
      const dupIds: number[] = [];
      for (const s of allSkills) {
        if (seen.has(s.name)) { if (s.id !== undefined) dupIds.push(s.id); }
        else seen.add(s.name);
      }
      if (dupIds.length) await db.skills.bulkDelete(dupIds);

      // Clean up any duplicate subjects from earlier versions
      const allSubj = await db.subjects.toArray();
      const seenS = new Set<string>();
      const dupSIds: number[] = [];
      for (const s of allSubj) {
        if (seenS.has(s.name)) { if (s.id !== undefined) dupSIds.push(s.id); }
        else seenS.add(s.name);
      }
      if (dupSIds.length) await db.subjects.bulkDelete(dupSIds);
    });
  }
}

export const db = new ProgressDB();

const DEFAULT_SKILLS = ['C Programming', 'AI', 'Robotics'];
const DEFAULT_SUBJECTS = ['English', 'Hindi', 'Math', 'Science', 'SST', 'Sanskrit', 'Computer'];

let seedPromise: Promise<void> | null = null;

export async function seedDefaults() {
  // Prevent concurrent seeding (React StrictMode double-invokes effects in dev)
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // Deduplicate skills — keep first occurrence of each name, delete the rest
    const allSkills = await db.skills.toArray();
    const seenSkill = new Set<string>();
    const dupSkillIds: number[] = [];
    for (const s of allSkills) {
      if (seenSkill.has(s.name)) {
        if (s.id !== undefined) dupSkillIds.push(s.id);
      } else {
        seenSkill.add(s.name);
      }
    }
    if (dupSkillIds.length > 0) {
      await db.skills.bulkDelete(dupSkillIds);
    }

    // Ensure all default skills exist (without duplicating)
    for (const name of DEFAULT_SKILLS) {
      const exists = await db.skills.where('name').equals(name).first();
      if (!exists) {
        await db.skills.add({ name, createdAt: Date.now() });
      }
    }

    // Deduplicate subjects — keep first occurrence of each name, delete the rest
    const allSubjects = await db.subjects.toArray();
    const seenSubj = new Set<string>();
    const dupSubjIds: number[] = [];
    for (const s of allSubjects) {
      if (seenSubj.has(s.name)) {
        if (s.id !== undefined) dupSubjIds.push(s.id);
      } else {
        seenSubj.add(s.name);
      }
    }
    if (dupSubjIds.length > 0) {
      await db.subjects.bulkDelete(dupSubjIds);
    }

    // Ensure all default subjects exist (without duplicating)
    for (const name of DEFAULT_SUBJECTS) {
      const exists = await db.subjects.where('name').equals(name).first();
      if (!exists) {
        await db.subjects.add({ name, createdAt: Date.now() });
      }
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({ theme: 'light' });
    }

    const timerCount = await db.timer.count();
    if (timerCount === 0) {
      await db.timer.add({
        status: 'idle',
        domain: 'study',
        category: '',
        activity: '',
        startTimestamp: null,
        pausedAt: null,
        accumulatedTime: 0,
      });
    }
  })();
  return seedPromise;
}
