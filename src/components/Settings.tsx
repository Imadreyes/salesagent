import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  Palette, 
  Crown, 
  Zap, 
  Check, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar,
  Save,
  Edit3,
  ExternalLink
} from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'billing'>('appearance');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
  });

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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
        }
      });

      if (error) throw error;

      // Update users table
      await supabase
        .from('users')
        .update({ full_name: profileData.full_name })
        .eq('id', user?.id);

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
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
          Customize your platform experience and manage your account
        </p>
      </div>

      {/* Tabs */}
      <div className={`rounded-xl shadow-sm border ${
        theme === 'gold' 
          ? 'black-card gold-border' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`border-b ${
          theme === 'gold' ? 'border-yellow-400/20' : 'border-gray-200'
        }`}>
          <nav className="flex overflow-x-auto px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? theme === 'gold'
                        ? 'border-yellow-400 text-yellow-400'
                        : 'border-blue-500 text-blue-600'
                      : theme === 'gold'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
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
                      {isSelected && (
                        <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${
                          theme === 'gold' ? 'bg-yellow-400' : 'bg-blue-500'
                        }`}>
                          <Check className="h-4 w-4 text-black" />
                        </div>
                      )}

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
                    </button>
                  );
                })}
              </div>

              <div className={`p-4 rounded-lg ${
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
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    theme === 'gold' 
                      ? 'gold-gradient' 
                      : 'bg-blue-100'
                  }`}>
                    <User className={`h-6 w-6 ${
                      theme === 'gold' ? 'text-black' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${
                      theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      Personal Information
                    </h2>
                    <p className={`text-sm ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Update your personal details
                    </p>
                  </div>
                </div>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === 'gold'
                        ? 'gold-gradient text-black hover-gold'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        theme === 'gold'
                          ? 'text-gray-400 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                          : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        theme === 'gold'
                          ? 'gold-gradient text-black hover-gold'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
                        theme === 'gold'
                          ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-800/50 disabled:text-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
                      } focus:outline-none`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${
                        theme === 'gold'
                          ? 'border-gray-600 bg-gray-800/50 text-gray-400'
                          : 'border-gray-300 bg-gray-50 text-gray-500'
                      } cursor-not-allowed`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${
                    theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Email cannot be changed from this interface
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
                        theme === 'gold'
                          ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-800/50 disabled:text-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
                      } focus:outline-none`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-2 rounded-lg ${
                  theme === 'gold' 
                    ? 'gold-gradient' 
                    : 'bg-blue-100'
                }`}>
                  <CreditCard className={`h-6 w-6 ${
                    theme === 'gold' ? 'text-black' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Billing & Subscription
                  </h2>
                  <p className={`text-sm ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Manage your subscription and billing information
                  </p>
                </div>
              </div>

              {/* Current Plan */}
              <div className={`p-6 rounded-lg border ${
                theme === 'gold'
                  ? 'border-yellow-400/30 bg-yellow-400/5'
                  : 'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {theme === 'gold' ? (
                      <Crown className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <Zap className="h-8 w-8 text-blue-600" />
                    )}
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        theme === 'gold' ? 'text-yellow-400' : 'text-blue-900'
                      }`}>
                        {theme === 'gold' ? 'Elite Plan' : 'Professional Plan'}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'gold' ? 'text-gray-400' : 'text-blue-700'
                      }`}>
                        Current subscription plan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-blue-900'
                    }`}>
                      ${theme === 'gold' ? '297' : '97'}/mo
                    </p>
                    <p className={`text-sm ${
                      theme === 'gold' ? 'text-gray-400' : 'text-blue-700'
                    }`}>
                      Billed monthly
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className={`flex items-center text-sm ${
                    theme === 'gold' ? 'text-gray-300' : 'text-blue-800'
                  }`}>
                    <Check className="h-4 w-4 mr-2" />
                    Unlimited campaigns
                  </div>
                  <div className={`flex items-center text-sm ${
                    theme === 'gold' ? 'text-gray-300' : 'text-blue-800'
                  }`}>
                    <Check className="h-4 w-4 mr-2" />
                    Advanced AI calling
                  </div>
                  <div className={`flex items-center text-sm ${
                    theme === 'gold' ? 'text-gray-300' : 'text-blue-800'
                  }`}>
                    <Check className="h-4 w-4 mr-2" />
                    {theme === 'gold' ? 'Priority support' : 'Email support'}
                  </div>
                  {theme === 'gold' && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Check className="h-4 w-4 mr-2" />
                      White-glove onboarding
                    </div>
                  )}
                </div>
              </div>

              {/* Book a Call Section */}
              <div className={`p-6 rounded-lg border-2 border-dashed ${
                theme === 'gold'
                  ? 'border-yellow-400/30 bg-black/20'
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="text-center">
                  <Calendar className={`h-12 w-12 mx-auto mb-4 ${
                    theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Need Help with Your Subscription?
                  </h3>
                  <p className={`text-sm mb-6 ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Book a call with our billing specialist to discuss your plan, 
                    upgrade options, or resolve any billing questions.
                  </p>
                  
                  <a
                    href="https://calendly.com/your-billing-team"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      theme === 'gold'
                        ? 'gold-gradient text-black hover-gold shadow-lg'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Call with Billing Team
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Recent Billing History
                </h3>
                
                <div className={`border rounded-lg overflow-hidden ${
                  theme === 'gold' ? 'border-yellow-400/20' : 'border-gray-200'
                }`}>
                  <div className={`px-4 py-3 border-b ${
                    theme === 'gold' 
                      ? 'bg-gray-800/50 border-yellow-400/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                      <span className={theme === 'gold' ? 'text-gray-300' : 'text-gray-700'}>
                        Date
                      </span>
                      <span className={theme === 'gold' ? 'text-gray-300' : 'text-gray-700'}>
                        Description
                      </span>
                      <span className={`text-right ${theme === 'gold' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Amount
                      </span>
                    </div>
                  </div>
                  
                  <div className={theme === 'gold' ? 'bg-black/20' : 'bg-white'}>
                    {[
                      { date: '2024-01-01', description: `${theme === 'gold' ? 'Elite' : 'Professional'} Plan`, amount: `$${theme === 'gold' ? '297' : '97'}.00` },
                      { date: '2023-12-01', description: `${theme === 'gold' ? 'Elite' : 'Professional'} Plan`, amount: `$${theme === 'gold' ? '297' : '97'}.00` },
                      { date: '2023-11-01', description: `${theme === 'gold' ? 'Elite' : 'Professional'} Plan`, amount: `$${theme === 'gold' ? '297' : '97'}.00` },
                    ].map((invoice, index) => (
                      <div key={index} className={`px-4 py-3 border-b last:border-b-0 ${
                        theme === 'gold' ? 'border-yellow-400/10' : 'border-gray-100'
                      }`}>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <span className={theme === 'gold' ? 'text-gray-400' : 'text-gray-600'}>
                            {invoice.date}
                          </span>
                          <span className={theme === 'gold' ? 'text-gray-300' : 'text-gray-900'}>
                            {invoice.description}
                          </span>
                          <span className={`text-right font-medium ${
                            theme === 'gold' ? 'text-yellow-400' : 'text-gray-900'
                          }`}>
                            {invoice.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}