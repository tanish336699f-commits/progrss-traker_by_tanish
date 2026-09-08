import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Subject, Chapter, ChapterStatus } from '@/lib/types';
import { Plus, BookOpen, Trash2 } from 'lucide-react';

export function StudyPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [name, setName] = useState('');
  const [chapterName, setChapterName] = useState<Record<number, string>>({});

  const load = async () => {
    setSubjects(await db.subjects.toArray());
    setChapters(await db.chapters.toArray());
  };

  useEffect(() => { load(); }, []);

  const addSubject = async () => {
    if (!name.trim()) return;
    await db.subjects.add({ name: name.trim(), createdAt: Date.now() });
    setName('');
    await load();
  };

  const deleteSubject = async (id: number) => {
    if (!window.confirm('Delete this subject and all its chapters?')) return;
    await db.chapters.where('subjectId').equals(id).delete();
    await db.subjects.delete(id);
    await load();
  };

  const addChapter = async (subjectId: number) => {
    if (!chapterName[subjectId]?.trim()) return;
    await db.chapters.add({ subjectId, name: chapterName[subjectId].trim(), status: 'not-started', createdAt: Date.now() });
    setChapterName({ ...chapterName, [subjectId]: '' });
    await load();
  };

  const deleteChapter = async (id: number) => {
    await db.chapters.delete(id);
    await load();
  };

  const cycleStatus = async (chapter: Chapter) => {
    const statusNext: Record<ChapterStatus, ChapterStatus> = {
      'not-started': 'in-progress',
      'in-progress': 'completed',
      'completed': 'not-started',
    };
    await db.chapters.update(chapter.id!, { status: statusNext[chapter.status] });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          className="field flex-1"
          placeholder="New subject name"
        />
        <button onClick={addSubject} className="btn-primary">
          <Plus className="w-4 h-4" /> Add subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="empty">
          <BookOpen className="w-8 h-8 mx-auto mb-2" />
          <p>Add your first subject to start tracking chapters.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {subjects.map((s) => {
            const rows = chapters.filter((c) => c.subjectId === s.id);
            const done = rows.filter((c) => c.status === 'completed').length;
            const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

            return (
              <div key={s.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{done} of {rows.length} completed</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {pct}%
                    </div>
                    <button
                      onClick={() => s.id && deleteSubject(s.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      aria-label={`Delete ${s.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {rows.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No chapters yet.</p>
                  ) : (
                    rows.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <button
                          onClick={() => cycleStatus(c)}
                          className={`flex-1 text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                            c.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 line-through'
                              : c.status === 'in-progress'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                              : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300'
                          }`}
                        >
                          {c.name}
                        </button>
                        <button
                          onClick={() => c.id && deleteChapter(c.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={chapterName[s.id!] ?? ''}
                    onChange={(e) => setChapterName({ ...chapterName, [s.id!]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addChapter(s.id!)}
                    className="field flex-1 text-sm"
                    placeholder="Add chapter or topic"
                  />
                  <button
                    onClick={() => addChapter(s.id!)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Add chapter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
