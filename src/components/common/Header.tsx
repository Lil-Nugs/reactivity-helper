import { ArrowLeft, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onSettings?: () => void;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
}

/**
 * App header with title, optional back button, and settings icon.
 * Handles iOS safe area insets for devices with notches.
 */
export function Header({
  title,
  onBack,
  onSettings,
  showBackButton = false,
  showSettingsButton = true,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-gray-200"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Back Button or Spacer */}
        <div className="flex items-center min-w-11">
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center min-h-11 min-w-11 -ml-2 text-indigo-600 active:text-indigo-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : null}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* Settings Button or Spacer */}
        <div className="flex items-center min-w-11">
          {showSettingsButton && onSettings ? (
            <button
              onClick={onSettings}
              className="flex items-center justify-center min-h-11 min-w-11 -mr-2 text-gray-600 active:text-gray-700 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
