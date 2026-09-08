import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Activity, Domain } from '@/lib/types';
import { formatDate, formatDuration, todayStr } from '@/lib/time';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

const emptyForm = { date: todayStr(), domain: 'study' as Domain, category: '', activity: '', duration: '', notes: '' };

export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [acts, subs, sks] = await Promise.all([db.activities.toArray(), db.subjects.toArray(), db.skills.toArray()]);
    setActivities(acts.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt));
    setSubjects(subs.map((s) => s.name));
    setSkills(sks.map((s) => s.name));
  };
  useEffect(() => { load(); }, []);

  const categories = form.domain === 'study' ? subjects : skills;
  const save = async () => {
    const duration = Number(form.duration) * 60;
    if (!form.category || !form.activity.trim() || !duration || duration < 0) return;
    const data: Activity = { date: form.date, domain: form.domain, category: form.category, activity: form.activity.trim(), duration, notes: form.notes.trim(), createdAt: Date.now() };
    if (editing) await db.activities.update(editing, data);
    else await db.activities.add(data);
    setForm({ ...emptyForm, date: form.date }); setEditing(null); setOpen(false); await load();
  };
  const edit = (a: Activity) => { setForm({ date: a.date, domain: a.domain, category: a.category, activity: a.activity, duration: String(Math.round(a.duration / 60)), notes: a.notes ?? '' }); setEditing(a.id ?? null); setOpen(true); };
  const remove = async (id: number) => { await db.activities.delete(id); await load(); };

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-gray-500 dark:text-gray-400">Your complete learning history</p></div><button onClick={() => { setForm({ ...emptyForm, date: todayStr() }); setEditing(null); setOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Add activity</button></div>
    {open && <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit activity' : 'Add activity'}</h3><button onClick={() => setOpen(false)} aria-label="Close"><X className="w-5 h-5 text-gray-500" /></button></div><div className="grid sm:grid-cols-2 gap-4">
      <label className="text-sm text-gray-700 dark:text-gray-300">Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1 w-full field" /></label>
      <label className="text-sm text-gray-700 dark:text-gray-300">Domain<select value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value as Domain, category: '' })} className="mt-1 w-full field"><option value="study">Study</option><option value="skills">Skills</option></select></label>
      <label className="text-sm text-gray-700 dark:text-gray-300">Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full field"><option value="">Select category</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm text-gray-700 dark:text-gray-300">Duration (minutes)<input type="number" min="1" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="mt-1 w-full field" placeholder="120" /></label>
      <label className="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">Activity<input value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} className="mt-1 w-full field" placeholder="Learned pointers" /></label>
      <label className="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">Notes<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full field min-h-20" placeholder="Optional notes" /></label>
    </div><button onClick={save} className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">{editing ? 'Save changes' : 'Add activity'}</button></div>}
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">{activities.length === 0 ? <div className="py-14 text-center text-sm text-gray-400">No activities yet.</div> : <div className="divide-y divide-gray-100 dark:divide-gray-700">{activities.map(a => <div key={a.id} className="p-4 flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${a.domain === 'study' ? 'bg-emerald-500' : 'bg-amber-500'}`} /><p className="font-medium text-sm text-gray-900 dark:text-white truncate">{a.activity}</p></div><p className="text-xs text-gray-500 mt-1">{a.category} · {formatDate(a.date)}{a.notes ? ` · ${a.notes}` : ''}</p></div><div className="flex items-center gap-3 shrink-0"><span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{formatDuration(a.duration)}</span><button onClick={() => edit(a)} aria-label="Edit"><Pencil className="w-4 h-4 text-gray-400 hover:text-blue-500" /></button><button onClick={() => a.id && remove(a.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button></div></div>)}</div>}</div>
  </div>;
}
