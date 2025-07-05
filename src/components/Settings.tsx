import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Crown, Zap, Check } from 'lucide-react';

export function Settings() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'blue' as const,
      name: 'Professional Blue',
      description: 'Clean, professional interface with blue accents',
      preview: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: Zap,
    },
    {
      id: 'gold' as const,
      name: 'Elite Gold',
      description: 'Luxury black & gold theme for premium experience',
      preview: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      icon: Crown,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${
          theme === 'gold' ? 'gold-text-gradient' : 'text-gray-900'
        }`}>
          Settings
        </h1>
        <p className={theme === 'gold' ? 'text-gray-400' : 'text-gray-600'}>
          Customize your platform experience
        </p>
      </div>

      {/* Theme Selection */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        theme === 'gold' 
          ? 'black-card gold-border' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-2 rounded-lg ${
            theme === 'gold' 
              ? 'gold-gradient' 
              : 'bg-blue-100'
          }`}>
            <Palette className={`h-6 w-6 ${
              theme === 'gold' ? 'text-black' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${
              theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Theme Selection
            </h2>
            <p className={`text-sm ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Choose your preferred interface theme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.id;
            
            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? theme === 'gold'
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'gold'
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${
                    theme === 'gold' ? 'bg-yellow-400' : 'bg-blue-500'
                  }`}>
                    <Check className="h-4 w-4 text-black" />
                  </div>
                )}

                {/* Theme preview */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${themeOption.preview}`}>
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {themeOption.name}
                    </h3>
                  </div>
                </div>

                <p className={`text-sm ${
                  theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {themeOption.description}
                </p>

                {/* Theme features */}
                <div className="mt-4 space-y-2">
                  {themeOption.id === 'blue' ? (
                    <div className="space-y-1">
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Clean and professional design
                      </div>
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Blue accent colors
                      </div>
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Light background
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Luxury black & gold design
                      </div>
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Premium feel and animations
                      </div>
                      <div className={`text-xs ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        • Dark background
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className={`mt-6 p-4 rounded-lg ${
          theme === 'gold' 
            ? 'bg-yellow-400/10 border border-yellow-400/20' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${
            theme === 'gold' ? 'text-yellow-400' : 'text-blue-700'
          }`}>
            💡 Your theme preference is automatically saved and will persist across sessions.
          </p>
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        theme === 'gold' 
          ? 'black-card gold-border' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
        }`}>
          More Settings Coming Soon
        </h2>
        <p className={`text-sm ${
          theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Additional customization options will be available in future updates.
        </p>
      </div>
    </div>
  );
}