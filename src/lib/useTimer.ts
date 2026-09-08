import { useEffect, useState, useCallback } from 'react';
import { db } from './db';
import type { TimerState, Domain } from './types';

const TIMER_ID = 1;

export function useTimer() {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const load = useCallback(async () => {
    const t = await db.timer.get(TIMER_ID);
    if (t) setTimer(t);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!timer || timer.status !== 'running' || !timer.startTimestamp) {
      return;
    }
    const update = () => {
      const now = Date.now();
      setElapsed(timer.accumulatedTime + (now - timer.startTimestamp!) / 1000);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const start = async (domain: Domain, category: string, activity: string) => {
    const now = Date.now();
    const existing = await db.timer.get(TIMER_ID);
    if (existing && existing.status === 'running') return;
    const state: TimerState = {
      id: TIMER_ID,
      status: 'running',
      domain,
      category,
      activity,
      startTimestamp: now,
      pausedAt: null,
      accumulatedTime: existing?.accumulatedTime ?? 0,
    };
    await db.timer.put(state);
    setTimer(state);
  };

  const pause = async () => {
    if (!timer || timer.status !== 'running' || !timer.startTimestamp) return;
    const now = Date.now();
    const additional = (now - timer.startTimestamp) / 1000;
    const newAccumulated = timer.accumulatedTime + additional;
    const state: TimerState = {
      ...timer,
      status: 'paused',
      startTimestamp: null,
      pausedAt: now,
      accumulatedTime: newAccumulated,
    };
    await db.timer.put(state);
    setTimer(state);
    setElapsed(newAccumulated);
  };

  const resume = async () => {
    if (!timer || timer.status !== 'paused') return;
    const state: TimerState = {
      ...timer,
      status: 'running',
      startTimestamp: Date.now(),
      pausedAt: null,
    };
    await db.timer.put(state);
    setTimer(state);
  };

  const stop = async (): Promise<TimerState | null> => {
    if (!timer) return null;
    let finalAccumulated = timer.accumulatedTime;
    if (timer.status === 'running' && timer.startTimestamp) {
      finalAccumulated += (Date.now() - timer.startTimestamp) / 1000;
    }
    const result = { ...timer, accumulatedTime: finalAccumulated };
    const reset: TimerState = {
      id: TIMER_ID,
      status: 'idle',
      domain: 'study',
      category: '',
      activity: '',
      startTimestamp: null,
      pausedAt: null,
      accumulatedTime: 0,
    };
    await db.timer.put(reset);
    setTimer(reset);
    setElapsed(0);
    return result;
  };

  const reset = async () => {
    const resetState: TimerState = {
      id: TIMER_ID,
      status: 'idle',
      domain: 'study',
      category: '',
      activity: '',
      startTimestamp: null,
      pausedAt: null,
      accumulatedTime: 0,
    };
    await db.timer.put(resetState);
    setTimer(resetState);
    setElapsed(0);
  };

  return { timer, elapsed, start, pause, resume, stop, reset, reload: load };
}
