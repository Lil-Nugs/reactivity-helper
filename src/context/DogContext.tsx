import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../db';
import type { Dog } from '../types/common';

interface DogContextType {
  activeDog: Dog | null;
  isLoading: boolean;
  error: string | null;
  setActiveDog: (dog: Dog) => void;
  refetch: () => Promise<void>;
}

const DogContext = createContext<DogContextType | null>(null);

interface DogProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages the active dog state.
 * Loads the first dog on mount (v1 is single-dog only).
 */
export function DogProvider({ children }: DogProviderProps) {
  const [activeDog, setActiveDog] = useState<Dog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveDog = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // v1: Single dog only, get the first one
      const dogs = await db.dogs.toArray();

      if (dogs.length > 0) {
        setActiveDog(dogs[0]);
      } else {
        setActiveDog(null);
      }
    } catch (err) {
      console.error('Failed to fetch active dog:', err);
      setError('Failed to load dog profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDog();
  }, []);

  const value: DogContextType = {
    activeDog,
    isLoading,
    error,
    setActiveDog,
    refetch: fetchActiveDog,
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
