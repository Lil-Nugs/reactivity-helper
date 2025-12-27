import { createContext, useContext, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Dog } from '../types/common';

interface DogContextType {
  activeDog: Dog | null;
  isLoading: boolean;
  error: string | null;
}

const DogContext = createContext<DogContextType | null>(null);

interface DogProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages the active dog state.
 * Uses useLiveQuery for reactive updates when database changes.
 * Loads the first dog (v1 is single-dog only).
 */
export function DogProvider({ children }: DogProviderProps) {
  // useLiveQuery automatically re-queries when the database changes
  const activeDog = useLiveQuery(
    async () => {
      // v1: Single dog only, get the first one
      const dogs = await db.dogs.toArray();
      return dogs.length > 0 ? dogs[0] : null;
    },
    [], // no dependencies
    null // default value while loading
  );

  // useLiveQuery returns undefined while loading, then the actual value
  const isLoading = activeDog === undefined;

  const value: DogContextType = {
    activeDog: activeDog ?? null,
    isLoading,
    error: null, // useLiveQuery handles errors internally
  };

  return <DogContext.Provider value={value}>{children}</DogContext.Provider>;
}

/**
 * Hook to access the active dog context.
 * Throws if used outside of DogProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDog(): DogContextType {
  const context = useContext(DogContext);

  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }

  return context;
}
