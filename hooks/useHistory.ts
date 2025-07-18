

import { useState, useCallback, useRef, useEffect } from 'react';
import type { HistoryState } from '../types.ts';

interface UseHistoryOptions {
  maxHistorySize?: number;
}

export const useHistory = <T>(
  initialState: T, 
  options: UseHistoryOptions = {}
) => {
  const { maxHistorySize = 50 } = options;
  
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const trimHistory = useCallback((past: T[]): T[] => {
    if (past.length > maxHistorySize) {
      return past.slice(-maxHistorySize);
    }
    return past;
  }, [maxHistorySize]);

  const setState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
    setHistory(currentHistory => {
        const newState = typeof newStateOrFn === 'function' 
            ? (newStateOrFn as (prevState: T) => T)(currentHistory.present) 
            : newStateOrFn;

        if (JSON.stringify(newState) === JSON.stringify(currentHistory.present)) {
            return currentHistory;
        }

        return {
            past: trimHistory([...currentHistory.past, currentHistory.present]),
            present: newState,
            future: [],
        };
    });
  }, [trimHistory]);
  
  const undo = useCallback(() => {
    setHistory(current => {
      const { past, present, future } = current;
      if (past.length === 0) return current;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return { past: newPast, present: previous, future: [present, ...future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(current => {
      const { past, present, future } = current;
      if (future.length === 0) return current;
      const next = future[0];
      const newFuture = future.slice(1);
      return { past: trimHistory([...past, present]), present: next, future: newFuture };
    });
  }, [trimHistory]);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const cleanup = useCallback(() => {
    // No-op now, but kept for API consistency
  }, []);
  
  useEffect(() => {
      return () => cleanup();
  }, [cleanup]);

  return { 
    state: history.present, 
    setState, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    reset,
    cleanup,
  };
};