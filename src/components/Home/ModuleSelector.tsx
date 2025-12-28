import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { db } from '../../db';
import type { Dog } from '../../types/common';

interface ModuleCard {
  emoji: string;
  title: string;
  subtitle: string;
  route: string;
}

const modules: ModuleCard[] = [
  {
    emoji: '🚶',
    title: 'Reactivity',
    subtitle: 'Log reactive incidents',
    route: '/reactivity',
  },
  {
    emoji: '🏠',
    title: 'Separation Anxiety',
    subtitle: 'Log departures',
    route: '/separation',
  },
  {
    emoji: '💊',
    title: 'Medications',
    subtitle: 'Log doses',
    route: '/medications',
  },
];

export function ModuleSelector() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [dogName, setDogName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForExistingDog = useCallback(async () => {
    try {
      const dogs = await db.dogs.toArray();

      if (dogs.length === 0) {
        // First run - no dog exists
        setShowFirstRun(true);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error checking for dogs:', err);
      setError('Failed to load app. Please refresh.');
      setIsLoading(false);
    }
  }, []);

  // Initial data load on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkForExistingDog();
  }, [checkForExistingDog]);

  async function handleCreateDog(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = dogName.trim();
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
      setError('Please enter a name (1-50 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the dog
      const newDog: Dog = {
        id: nanoid(),
        name: trimmedName,
      };

      await db.dogs.add(newDog);

      // Create user settings with this dog as active
      await db.userSettings.put({
        activeDogId: newDog.id,
        recentTags: [],
        darkMode: false,
      });

      // Hide first-run prompt and show module selector
      setShowFirstRun(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error creating dog:', err);
      setError('Failed to create dog profile. Please try again.');
      setIsSubmitting(false);
    }
  }

  function handleModuleClick(route: string) {
    navigate(route);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🐕</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !showFirstRun) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-900 font-semibold mb-2">Oops!</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // First-run experience
  if (showFirstRun) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          {/* App branding */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reactivity Helper
            </h1>
            <p className="text-gray-600">
              Track reactivity, separation anxiety, and medications
            </p>
          </div>

          {/* First-run form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Welcome! What's your dog's name?
            </h2>

            <form onSubmit={handleCreateDog}>
              <div className="mb-4">
                <input
                  type="text"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  placeholder="Enter dog's name"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !dogName.trim()}
                className="w-full min-h-11 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Get Started'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main module selector
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm pt-safe">
        <div className="px-4 py-4">
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">🐕</span>
            <h1 className="text-xl font-bold text-gray-900">
              Reactivity Helper
            </h1>
          </div>
        </div>
      </header>

      {/* Module cards */}
      <main className="p-4 max-w-2xl mx-auto">
        <div className="space-y-4 pt-2">
          {modules.map((module) => (
            <button
              key={module.route}
              onClick={() => handleModuleClick(module.route)}
              className="w-full min-h-24 bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg active:shadow-sm transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-4xl mr-4">{module.emoji}</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {module.title}
                  </h2>
                  <p className="text-gray-600">{module.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
