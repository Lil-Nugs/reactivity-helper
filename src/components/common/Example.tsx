import { useState } from 'react';
import { Header } from './Header';
import { BottomNav, type TabType } from './BottomNav';

/**
 * Example component demonstrating Header and BottomNav usage.
 * This shows the typical layout structure for module screens.
 */
export function Example() {
  const [activeTab, setActiveTab] = useState<TabType>('log');

  const handleBack = () => {
    console.log('Back button clicked');
  };

  const handleSettings = () => {
    console.log('Settings button clicked');
  };

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
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'log' && 'Quick Log'}
              {activeTab === 'history' && 'History'}
              {activeTab === 'stats' && 'Analytics'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'log' &&
                'Log reactive incidents quickly with minimal taps.'}
              {activeTab === 'history' &&
                'View past incidents with filters and search.'}
              {activeTab === 'stats' && 'See trends and insights over time.'}
            </p>
          </div>

          {/* Sample content cards */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                Sample content card {i + 1}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
