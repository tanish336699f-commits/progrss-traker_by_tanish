import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Activity, Goal } from '@/lib/types';
import { formatDuration, todayStr, getLast7Days, formatDate } from '@/lib/time';
import { useNavigatePage } from '@/lib/AppContext';
import { Play, Clock, BookOpen, Award, ArrowRight, Target, Check, Trophy } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export function DashboardPage() {
  const navigate = useNavigatePage();
  const [todayStudy, setTodayStudy] = useState(0);
  const [todaySkills, setTodaySkills] = useState(0);
  const [recent, setRecent] = useState<Activity[]>([]);
  const [weekData, setWeekData] = useState<{ date: string; seconds: number }[]>([]);
  const [todayGoals, setTodayGoals] = useState<Goal[]>([]);

  useEffect(() => {
    (async () => {
      const today = todayStr();
      const all = await db.activities.toArray();
      const todayActs = all.filter((a) => a.date === today);
      setTodayStudy(todayActs.filter((a) => a.domain === 'study').reduce((s, a) => s + a.duration, 0));
      setTodaySkills(todayActs.filter((a) => a.domain === 'skills').reduce((s, a) => s + a.duration, 0));

      const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
      setRecent(sorted.slice(0, 5));

      const days = getLast7Days();
      const wd = days.map((d) => ({
        date: d,
        seconds: all.filter((a) => a.date === d).reduce((s, a) => s + a.duration, 0),
      }));
      setWeekData(wd);

      const goals = await db.goals.toArray();
      setTodayGoals(goals.filter((g) => g.date === today));
    })();
  }, []);

  const todayTotal = todayStudy + todaySkills;

  const stats = [
    { label: "Today's Total", value: formatDuration(todayTotal), icon: Clock, color: 'blue' },
    { label: 'Study Time', value: formatDuration(todayStudy), icon: BookOpen, color: 'emerald' },
    { label: 'Skills Time', value: formatDuration(todaySkills), icon: Award, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  const completedCount = todayGoals.filter((g) => g.status === 'completed').length;
  const allDone = todayGoals.length > 0 && completedCount === todayGoals.length;

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Ready to learn?</h3>
            <p className="text-blue-50 text-sm">Start a timer to track your session.</p>
          </div>
          <button
            onClick={() => navigate('timer')}
            className="flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Quick Start Timer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={'w-10 h-10 rounded-lg flex items-center justify-center ' + colorMap[s.color]}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Goals */}
      {todayGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Goals</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {completedCount}/{todayGoals.length} done
              </span>
            </div>
            <button
              onClick={() => navigate('goals')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {todayGoals.map((g) => {
              const checkClass = g.status === 'completed'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : g.status === 'missed'
                ? 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/40'
                : 'border-gray-300 dark:border-gray-600';
              const labelClass = g.status === 'completed'
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-700 dark:text-gray-300';
              return (
                <div key={g.id} className="flex items-center gap-3 py-1.5">
                  <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ' + checkClass}>
                    {g.status === 'completed' && <Check className="w-3 h-3" />}
                  </div>
                  <span className={'text-sm flex-1 ' + labelClass}>{g.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{g.targetMinutes}m</span>
                </div>
              );
            })}
          </div>
          {allDone && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">All goals completed! Great job!</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weekData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v + 'T00:00:00');
                return d.toLocaleDateString('en-US', { weekday: 'short' });
              }}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatDuration(v)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => [formatDuration(Number(v ?? 0)), 'Time']}
              labelFormatter={(l) => formatDate(l as string)}
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="seconds"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorTime)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
          <button
            onClick={() => navigate('log')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 dark:text-gray-500">No activities yet. Start a timer or add one manually.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={'w-2 h-2 rounded-full shrink-0 ' + (a.domain === 'study' ? 'bg-emerald-500' : 'bg-amber-500')}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.activity}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.category} · {formatDate(a.date)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0 ml-3">
                  {formatDuration(a.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
