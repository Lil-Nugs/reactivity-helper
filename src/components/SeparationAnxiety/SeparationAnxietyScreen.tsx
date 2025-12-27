import { useNavigate } from 'react-router-dom';
import { Header } from '../common/Header';

/**
 * Placeholder screen for Separation Anxiety module.
 * Will be implemented in a future phase.
 */
export function SeparationAnxietyScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        title="Separation Anxiety"
        showBackButton={true}
        onBack={() => navigate('/')}
        showSettingsButton={false}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Coming Soon
        </h2>
        <p className="text-gray-600 text-center max-w-sm">
          Track departures and separation anxiety progress. This feature is under development.
        </p>
      </main>
    </div>
  );
}
