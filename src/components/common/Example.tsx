import { useState } from 'react';
import { Header } from './Header';
import { BottomNav, type TabType } from './BottomNav';
import { IncidentList } from '../Reactivity/History/IncidentList';
import { useDog } from '../../hooks/useDog';

/**
 * Reactivity module screen with tab-based navigation.
 * Handles first-run setup (dog name entry) and displays
 * Log, History, and Stats tabs.
 */
export function Example() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [dogName, setDogName] = useState('');
  const { dog, isLoading, createDog } = useDog();

  const handleBack = () => {
    console.log('Back button clicked');
  };

  const handleSettings = () => {
    console.log('Settings button clicked');
  };

  const handleCreateDog = async () => {
    if (dogName.trim()) {
      await createDog(dogName.trim());
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // First run: No dog exists yet
  if (!dog) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🐕</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Reactivity Helper
              </h1>
              <p className="text-gray-600">
                Let's get started by adding your dog's name.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your dog's name"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={handleCreateDog}
                disabled={!dogName.trim()}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-indigo-700 transition-colors min-h-11"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header
        title="Reactivity"
        showBackButton={true}
        onBack={handleBack}
        showSettingsButton={true}
        onSettings={handleSettings}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col pb-20 overflow-hidden">
        {activeTab === 'log' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Quick Log
                </h2>
                <p className="text-gray-600">
                  Log reactive incidents quickly with minimal taps.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  (Quick Log UI coming in Phase 2)
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <IncidentList
            dogId={dog.id}
            onIncidentClick={(incident) => {
              console.log('Incident clicked:', incident.id);
            }}
          />
        )}

        {activeTab === 'stats' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Analytics
                </h2>
                <p className="text-gray-600">
                  See trends and insights over time.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  (Analytics UI coming in Phase 5)
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
