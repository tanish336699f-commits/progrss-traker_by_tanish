import { useEffect, useState } from 'react';
import { useTimer } from '@/lib/useTimer';
import { db } from '@/lib/db';
import type { Domain, Activity } from '@/lib/types';
import { todayStr, formatTimer } from '@/lib/time';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

export function TimerPage() {
  const { timer, elapsed, start, pause, resume, stop, reset } = useTimer();
  const [domain, setDomain] = useState<Domain>('study');
  const [category, setCategory] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [activity, setActivity] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const subs = await db.subjects.toArray();
      setSubjects(subs.map((s) => s.name));
      const sks = await db.skills.toArray();
      setSkills(sks.map((s) => s.name));
    })();
  }, []);

  const categories = domain === 'study' ? subjects : skills;

  const isRunning = timer?.status === 'running';
  const isPaused = timer?.status === 'paused';
  const isActive = isRunning || isPaused;

  const handleStart = () => {
    if (!category || !activity) return;
    start(domain, category, activity);
  };

  const handleStop = async () => {
    const result = await stop();
    if (result && result.accumulatedTime > 0) {
      const act: Activity = {
        date: todayStr(),
        domain: result.domain,
        category: result.category,
        activity: result.activity,
        duration: Math.round(result.accumulatedTime),
        notes: 'Timer session',
        createdAt: Date.now(),
      };
      await db.activities.add(act);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    }
    setCategory('');
    setActivity('');
  };

  const displayTime = isActive ? formatTimer(elapsed) : '00:00:00';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Timer Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRunning ? 'bg-green-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {isRunning ? 'Running' : isPaused ? 'Paused' : 'Idle'}
          </span>
        </div>
        <div className="font-mono text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tabular-nums mb-2">
          {displayTime}
        </div>
        {isActive && timer && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {timer.domain === 'study' ? 'Study' : 'Skills'} · {timer.category} · {timer.activity}
          </p>
        )}
        {justSaved && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
            Session saved to activities!
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-5">
        {!isActive ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domain</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setDomain('study'); setCategory(''); }}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    domain === 'study'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Study
                </button>
                <button
                  onClick={() => { setDomain('skills'); setCategory(''); }}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    domain === 'skills'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Skills
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                  No {domain === 'study' ? 'subjects' : 'skills'} yet. Add some in the {domain === 'study' ? 'Study' : 'Skills'} page.
                </p>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select {domain === 'study' ? 'subject' : 'skill'}…</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity</label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g. Learned pointers"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!category || !activity}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Start Timer
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            {isRunning && (
              <button
                onClick={pause}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-3 rounded-xl hover:bg-amber-600 transition-colors"
              >
                <Pause className="w-5 h-5" fill="currentColor" />
                Pause
              </button>
            )}
            {isPaused && (
              <button
                onClick={resume}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Resume
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
            >
              <Square className="w-5 h-5" fill="currentColor" />
              Stop & Save
            </button>
          </div>
        )}

        {isPaused && (
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 font-medium py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Discard & Reset
          </button>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          The timer uses real timestamps and persists in IndexedDB, so it stays accurate even if you switch tabs, minimize the browser, or refresh the page. Only one timer runs at a time.
        </p>
      </div>
    </div>
  );
}
