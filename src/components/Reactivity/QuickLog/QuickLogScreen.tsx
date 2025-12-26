import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Header } from '../../common/Header';
import { BottomNav } from '../../common/BottomNav';
import { TriggerGrid } from './TriggerGrid';
import { IntensitySlider } from './IntensitySlider';
import { db } from '../../../db';
import { useDog } from '../../../context';
import type { TriggerType, Incident } from '../../../types/reactivity';

/**
 * Main Quick Log screen for reactivity incidents.
 * Flow: Select trigger → Select intensity → LOG IT (3 taps)
 *
 * Auto-captures:
 * - Timestamp (ISO 8601)
 * - Location (if permission granted, fails gracefully)
 */
export function QuickLogScreen() {
  const navigate = useNavigate();
  const { activeDog } = useDog();

  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get active dog ID from context
  const activeDogId = activeDog?.id ?? '';

  const canSubmit = selectedTrigger && selectedIntensity && activeDogId;

  const handleLogIncident = async () => {
    if (!canSubmit || isLogging) return;

    setIsLogging(true);

    try {
      // Create incident object
      const incident: Incident = {
        id: nanoid(),
        dogId: activeDogId,
        timestamp: new Date().toISOString(),
        trigger: selectedTrigger,
        intensity: selectedIntensity,
      };

      // Attempt to capture location (optional, fails gracefully)
      try {
        const position = await getCurrentPosition();
        incident.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // TODO: Auto-match to named location using db helper
        // const namedLocation = await findNearestLocation(
        //   activeDogId,
        //   position.coords.latitude,
        //   position.coords.longitude
        // );
        // if (namedLocation) {
        //   incident.location.namedLocationId = namedLocation.id;
        // }
      } catch (err) {
        // Location failed or denied - continue without it
        console.debug('Location not available:', err);
      }

      // Save to database
      await db.incidents.add(incident);

      // Show success feedback
      setShowSuccess(true);

      // Reset form after brief success message
      setTimeout(() => {
        setSelectedTrigger(null);
        setSelectedIntensity(null);
        setShowSuccess(false);
        setIsLogging(false);
      }, 1500);

    } catch (error) {
      console.error('Failed to log incident:', error);
      setIsLogging(false);
      // TODO: Show error toast
      alert('Failed to log incident. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title="Reactivity Log"
        showBackButton={true}
        onBack={() => navigate('/')}
        showSettingsButton={false}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 space-y-6">
        {/* Trigger Grid */}
        <TriggerGrid
          selectedTrigger={selectedTrigger}
          onSelect={setSelectedTrigger}
        />

        {/* Intensity Slider */}
        <IntensitySlider
          selectedIntensity={selectedIntensity}
          onSelect={setSelectedIntensity}
        />

        {/* Details Expander - TODO: Phase 2 */}
        <button
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium text-sm active:bg-gray-50 transition-colors"
          disabled
        >
          + Add More Details
        </button>

        {/* Log Button */}
        <button
          onClick={handleLogIncident}
          disabled={!canSubmit || isLogging}
          className={`
            w-full min-h-14 px-6 rounded-lg font-semibold text-lg
            transition-all
            ${
              canSubmit && !isLogging
                ? 'bg-indigo-600 text-white active:bg-indigo-700 shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
            ${showSuccess ? 'bg-green-600 text-white' : ''}
          `}
        >
          {showSuccess ? '✓ Logged!' : isLogging ? 'Logging...' : 'LOG IT'}
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="log"
        onTabChange={(tab) => {
          // TODO: Handle tab changes when history/stats screens exist
          console.log('Tab change:', tab);
        }}
      />
    </div>
  );
}

/**
 * Promise wrapper for geolocation API
 */
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        timeout: 5000,
        maximumAge: 30000,
        enableHighAccuracy: false, // Use faster, less accurate location
      }
    );
  });
}
