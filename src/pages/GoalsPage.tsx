import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Goal } from '@/lib/types';
import { todayStr, toDateStr, formatDate } from '@/lib/time';
import { Target, Plus, Trash2, Check, Trophy, Sparkles, Calendar } from 'lucide-react';

const DOMAIN_LABELS: Record<string, string> = {
  study: 'Study',
  skills: 'Skills',
  other: 'Other',
};

const DOMAIN_COLORS: Record<string, string> = {
  study: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  skills: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  other: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
};

const PRAISE_MESSAGES = [
  'Amazing work! You crushed it!',
  'Goal smashed! Keep that momentum going!',
  'Fantastic effort! You showed up and delivered!',
  'Another win in the bag! Stay consistent!',
  'Brilliant! Discipline is your superpower!',
  'You did it! Be proud of that!',
];

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<Goal['domain']>('study');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date(Date.now() + 86400000))); // tomorrow
  const [celebration, setCelebration] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all = await db.goals.toArray();
    all.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    setGoals(all);
  }, []);

  useEffect(() => {
    load();
    // Auto-mark yesterday's pending goals as missed
    (async () => {
      const today = todayStr();
      const pending = await db.goals.where('status').equals('pending').toArray();
      const stale = pending.filter((g) => g.date < today);
      for (const g of stale) {
        if (g.id !== undefined) await db.goals.update(g.id, { status: 'missed' });
      }
      if (stale.length) await load();
    })();
  }, [load]);

  const addGoal = async () => {
    if (!title.trim()) return;
    await db.goals.add({
      title: title.trim(),
      domain,
      targetMinutes,
      date: selectedDate,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
    });
    setTitle('');
    setTargetMinutes(60);
    await load();
  };

  const completeGoal = async (goal: Goal) => {
    if (goal.id === undefined) return;
    await db.goals.update(goal.id, { status: 'completed', completedAt: Date.now() });
    await load();
    const msg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
    setCelebration(msg);
    setTimeout(() => setCelebration(null), 4000);
  };

  const deleteGoal = async (id: number) => {
    await db.goals.delete(id);
    await load();
  };

  const today = todayStr();
  const todayGoals = goals.filter((g) => g.date === today);
  const tomorrowGoals = goals.filter((g) => g.date > today);
  const completedToday = todayGoals.filter((g) => g.status === 'completed').length;

  return (
    <div className="space-y-6 relative">
      {/* Celebration overlay */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl px-8 py-6 border border-amber-200 dark:border-amber-500/30 animate-bounce max-w-sm mx-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{celebration}</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="w-5 h-5 text-amber-400"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add goal form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Set a Goal</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Plan what you want to accomplish</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            className="field w-full"
            placeholder="What do you want to do? e.g. Study Math, Practice Guitar, Go for a run"
          />
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as Goal['domain'])}
                className="field w-full"
              >
                <option value="study">Study</option>
                <option value="skills">Skills</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Target (minutes)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Math.max(5, Number(e.target.value) || 5))}
                className="field w-full"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="field w-full"
              />
            </div>
          </div>
          <button onClick={addGoal} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add goal
          </button>
        </div>
      </div>

      {/* Today's goals */}
      <GoalSection
        title="Today's Goals"
        icon={<Calendar className="w-4 h-4" />}
        goals={todayGoals}
        badge={completedToday > 0 ? `${completedToday}/${todayGoals.length} done` : undefined}
        onComplete={completeGoal}
        onDelete={deleteGoal}
      />

      {/* Upcoming goals */}
      <GoalSection
        title="Upcoming Goals"
        icon={<Target className="w-4 h-4" />}
        goals={tomorrowGoals}
        onComplete={completeGoal}
        onDelete={deleteGoal}
        showDate
      />
    </div>
  );
}

function GoalSection({
  title,
  icon,
  goals,
  badge,
  onComplete,
  onDelete,
  showDate,
}: {
  title: string;
  icon: React.ReactNode;
  goals: Goal[];
  badge?: string;
  onComplete: (g: Goal) => void;
  onDelete: (id: number) => void;
  showDate?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {badge}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
      </div>
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-dashed border-gray-200 dark:border-gray-700 text-center">
          <Target className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No goals here yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <div
              key={g.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 border flex items-center gap-3 transition-all ${
                g.status === 'completed'
                  ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                  : g.status === 'missed'
                  ? 'border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <button
                onClick={() => g.status === 'pending' && onComplete(g)}
                disabled={g.status !== 'pending'}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  g.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : g.status === 'missed'
                    ? 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/40 text-red-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                }`}
                aria-label={g.status === 'completed' ? 'Completed' : 'Mark complete'}
              >
                {g.status === 'completed' && <Check className="w-4 h-4" />}
                {g.status === 'missed' && <span className="text-xs font-bold">!</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    g.status === 'completed'
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {g.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${DOMAIN_COLORS[g.domain]}`}>
                    {DOMAIN_LABELS[g.domain]}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{g.targetMinutes} min</span>
                  {showDate && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(g.date)}</span>
                  )}
                  {g.status === 'missed' && (
                    <span className="text-xs text-red-500 font-medium">Missed</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => g.id !== undefined && onDelete(g.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                aria-label="Delete goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
