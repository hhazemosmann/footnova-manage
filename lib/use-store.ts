'use client';

import { useSyncExternalStore } from 'react';
import { AppState, getServerState, getState, subscribe } from './store';

/* Single subscription point for the store. The shell layout calls this once
 * so navigating between views does not tear the store down; individual view
 * pages call it too, but they share the same module-scope state. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}
