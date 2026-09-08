import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Skill, Activity } from '@/lib/types';
import { formatDuration } from '@/lib/time';
import { Award, Plus, Trash2 } from 'lucide-react';

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState('');

  const load = async () => {
    setSkills(await db.skills.toArray());
    setActivities(await db.activities.where('domain').equals('skills').toArray());
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await db.skills.add({ name: name.trim(), createdAt: Date.now() });
    setName('');
    await load();
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this skill?')) return;
    await db.skills.delete(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="field flex-1"
          placeholder="Add a skill"
        />
        <button onClick={add} className="btn-primary">
          <Plus className="w-4 h-4" /> Add skill
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((s) => {
          const time = activities.filter((a) => a.category === s.name).reduce((sum, a) => sum + a.duration, 0);
          const count = activities.filter((a) => a.category === s.name).length;
          return (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <button
                  onClick={() => s.id && remove(s.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{count} practice sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{formatDuration(time)}</p>
              <p className="text-xs text-gray-500">total practice time</p>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-4">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (time / 3600) * 10)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
