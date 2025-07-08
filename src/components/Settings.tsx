import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Settings as SettingsIcon,
  MessageSquare,
  Trash2,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

interface Channel {
  id: string;
  provider: string;
  channel_type: string;
  credentials: any;
  sender_id: string | null;
  is_active: boolean;
  usage_count: number;
  max_usage: number;
  created_at: string;
}

interface ChannelFormData {
  provider: string;
  channel_type: string;
  credentials: { [key: string]: string };
  sender_id: string;
}

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'billing' | 'channels'>('appearance');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: boolean }>({});
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
  });
  const [channelFormData, setChannelFormData] = useState<ChannelFormData>({
    provider: '',
    channel_type: '',
    credentials: {},
    sender_id: ''
  });

  useEffect(() => {
    if (activeTab === 'channels') {
      fetchChannels();
    }
  }, [activeTab]);

  const fetchChannels = async () => {
    if (!user) return;
    
    setChannelLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setChannelLoading(false);
    }
  };

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const channelData = {
        user_id: user.id,
        provider: channelFormData.provider,
        channel_type: channelFormData.channel_type,
        credentials: channelFormData.credentials,
        sender_id: channelFormData.sender_id || null,
        is_active: true,
        usage_count: 0,
        max_usage: 100
      };

      if (editingChannel) {
        const { error } = await supabase
          .from('channels')
          .update(channelData)
          .eq('id', editingChannel.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channels')
          .insert([channelData]);
        
        if (error) throw error;
      }

      setShowChannelForm(false);
      setEditingChannel(null);
      setChannelFormData({
        provider: '',
        channel_type: '',
        credentials: {},
        sender_id: ''
      });
      fetchChannels();
    } catch (error) {
      console.error('Error saving channel:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel integration?')) return;

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelFormData({
      provider: channel.provider,
      channel_type: channel.channel_type,
      credentials: channel.credentials || {},
      sender_id: channel.sender_id || ''
    });
    setShowChannelForm(true);
  };

  const toggleCredentialVisibility = (channelId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  };

  const getChannelIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'vapi':
        return Phone;
      case 'twilio':
        return MessageSquare;
      case 'instantly':
        return Mail;
      case 'bicep':
        return SettingsIcon;
      default:
        return SettingsIcon;
    }
  };

  const getCredentialFields = (provider: string, channelType: string) => {
    const fields: { key: string; label: string; type: string; required: boolean }[] = [];
    
    switch (provider.toLowerCase()) {
      case 'vapi':
        fields.push(
          { key: 'api_key', label: 'VAPI API Key', type: 'password', required: true },
          { key: 'assistant_id', label: 'Assistant ID', type: 'text', required: false }
        );
        break;
      case 'twilio':
        fields.push(
          { key: 'account_sid', label: 'Account SID', type: 'text', required: true },
          { key: 'auth_token', label: 'Auth Token', type: 'password', required: true }
        );
        if (channelType === 'whatsapp') {
          fields.push({ key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', required: true });
        } else {
          fields.push({ key: 'phone_number', label: 'Phone Number', type: 'text', required: true });
        }
        break;
      case 'instantly':
        fields.push(
          { key: 'api_key', label: 'Instantly.ai API Key', type: 'password', required: true },
          { key: 'workspace_id', label: 'Workspace ID', type: 'text', required: false }
        );
        break;
      case 'bicep':
        fields.push(
          { key: 'api_key', label: 'Bicep API Key', type: 'password', required: true },
          { key: 'endpoint', label: 'API Endpoint', type: 'text', required: false }
        );
        break;
    }
    
    return fields;
  };
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
    { id: 'channels', label: 'Channels', icon: SettingsIcon },
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

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    theme === 'gold' 
                      ? 'gold-gradient' 
                      : 'bg-blue-100'
                  }`}>
                    <SettingsIcon className={`h-6 w-6 ${
                      theme === 'gold' ? 'text-black' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${
                      theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      Channel Integrations
                    </h2>
                    <p className={`text-sm ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Connect your communication channels and services
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowChannelForm(true)}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'gold'
                      ? 'gold-gradient text-black hover-gold'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </button>
              </div>

              {/* Channel Form Modal */}
              {showChannelForm && (
                <div className={`fixed inset-0 z-50 overflow-y-auto ${
                  theme === 'gold' ? 'bg-black/75' : 'bg-gray-900/50'
                }`}>
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div className={`w-full max-w-md rounded-xl shadow-2xl ${
                      theme === 'gold' ? 'black-card gold-border' : 'bg-white border border-gray-200'
                    }`}>
                      <div className={`p-6 border-b ${
                        theme === 'gold' ? 'border-yellow-400/20' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg font-semibold ${
                            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {editingChannel ? 'Edit Channel' : 'Add New Channel'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowChannelForm(false);
                              setEditingChannel(null);
                              setChannelFormData({
                                provider: '',
                                channel_type: '',
                                credentials: {},
                                sender_id: ''
                              });
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'gold'
                                ? 'text-gray-400 hover:bg-gray-800'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleChannelSubmit} className="p-6 space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Provider
                          </label>
                          <select
                            value={channelFormData.provider}
                            onChange={(e) => setChannelFormData({ 
                              ...channelFormData, 
                              provider: e.target.value,
                              credentials: {} // Reset credentials when provider changes
                            })}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              theme === 'gold'
                                ? 'border-yellow-400/30 bg-black/50 text-gray-200 focus:ring-yellow-400'
                                : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                            }`}
                            required
                          >
                            <option value="">Select Provider</option>
                            <option value="vapi">VAPI</option>
                            <option value="twilio">Twilio</option>
                            <option value="instantly">Instantly.ai</option>
                            <option value="bicep">Bicep</option>
                          </select>
                        </div>

                        {channelFormData.provider && (
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Channel Type
                            </label>
                            <select
                              value={channelFormData.channel_type}
                              onChange={(e) => setChannelFormData({ 
                                ...channelFormData, 
                                channel_type: e.target.value 
                              })}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                theme === 'gold'
                                  ? 'border-yellow-400/30 bg-black/50 text-gray-200 focus:ring-yellow-400'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                              }`}
                              required
                            >
                              <option value="">Select Type</option>
                              {channelFormData.provider === 'vapi' && (
                                <option value="voice">Voice Calls</option>
                              )}
                              {channelFormData.provider === 'twilio' && (
                                <>
                                  <option value="sms">SMS</option>
                                  <option value="whatsapp">WhatsApp</option>
                                </>
                              )}
                              {channelFormData.provider === 'instantly' && (
                                <option value="email">Email</option>
                              )}
                              {channelFormData.provider === 'bicep' && (
                                <option value="api">API Integration</option>
                              )}
                            </select>
                          </div>
                        )}

                        {channelFormData.provider && channelFormData.channel_type && (
                          <>
                            {getCredentialFields(channelFormData.provider, channelFormData.channel_type).map((field) => (
                              <div key={field.key}>
                                <label className={`block text-sm font-medium mb-2 ${
                                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {field.label} {field.required && '*'}
                                </label>
                                <input
                                  type={field.type}
                                  value={channelFormData.credentials[field.key] || ''}
                                  onChange={(e) => setChannelFormData({
                                    ...channelFormData,
                                    credentials: {
                                      ...channelFormData.credentials,
                                      [field.key]: e.target.value
                                    }
                                  })}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                    theme === 'gold'
                                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                                  }`}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  required={field.required}
                                />
                              </div>
                            ))}

                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Sender ID (Optional)
                              </label>
                              <input
                                type="text"
                                value={channelFormData.sender_id}
                                onChange={(e) => setChannelFormData({
                                  ...channelFormData,
                                  sender_id: e.target.value
                                })}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                  theme === 'gold'
                                    ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                                }`}
                                placeholder="Custom sender identifier"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowChannelForm(false);
                              setEditingChannel(null);
                              setChannelFormData({
                                provider: '',
                                channel_type: '',
                                credentials: {},
                                sender_id: ''
                              });
                            }}
                            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                              theme === 'gold'
                                ? 'text-gray-400 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              theme === 'gold'
                                ? 'gold-gradient text-black hover-gold'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {saving ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Saving...
                              </div>
                            ) : (
                              editingChannel ? 'Update Channel' : 'Add Channel'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Channels List */}
              {channelLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                    theme === 'gold' ? 'border-yellow-400' : 'border-blue-600'
                  }`}></div>
                </div>
              ) : channels.length === 0 ? (
                <div className={`text-center py-12 border-2 border-dashed rounded-lg ${
                  theme === 'gold'
                    ? 'border-yellow-400/30 text-gray-400'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className={`text-lg font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    No channels configured
                  </h3>
                  <p className="mb-4">
                    Add your first channel integration to start using the platform
                  </p>
                  <button
                    onClick={() => setShowChannelForm(true)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === 'gold'
                        ? 'gold-gradient text-black hover-gold'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Channel
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {channels.map((channel) => {
                    const Icon = getChannelIcon(channel.provider);
                    return (
                      <div
                        key={channel.id}
                        className={`p-6 rounded-lg border ${
                          theme === 'gold'
                            ? 'border-yellow-400/20 bg-black/20'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              theme === 'gold' ? 'gold-gradient' : 'bg-blue-100'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                theme === 'gold' ? 'text-black' : 'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className={`text-lg font-semibold capitalize ${
                                  theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {channel.provider}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  channel.is_active
                                    ? theme === 'gold'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-green-100 text-green-800'
                                    : theme === 'gold'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {channel.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className={`text-sm capitalize mb-2 ${
                                theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {channel.channel_type.replace('_', ' ')}
                              </p>
                              {channel.sender_id && (
                                <p className={`text-sm ${
                                  theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Sender ID: {channel.sender_id}
                                </p>
                              )}
                              <div className={`text-xs mt-2 ${
                                theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                Usage: {channel.usage_count} / {channel.max_usage}
                              </div>
                              
                              {/* Credentials Preview */}
                              <div className="mt-3">
                                <button
                                  onClick={() => toggleCredentialVisibility(channel.id)}
                                  className={`flex items-center text-xs ${
                                    theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                                  } hover:underline`}
                                >
                                  {showCredentials[channel.id] ? (
                                    <EyeOff className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Eye className="h-3 w-3 mr-1" />
                                  )}
                                  {showCredentials[channel.id] ? 'Hide' : 'Show'} Credentials
                                </button>
                                
                                {showCredentials[channel.id] && (
                                  <div className={`mt-2 p-3 rounded border text-xs font-mono ${
                                    theme === 'gold'
                                      ? 'bg-gray-800/50 border-gray-600 text-gray-300'
                                      : 'bg-gray-50 border-gray-200 text-gray-700'
                                  }`}>
                                    {Object.entries(channel.credentials || {}).map(([key, value]) => (
                                      <div key={key} className="mb-1">
                                        <span className="font-semibold">{key}:</span> {
                                          key.toLowerCase().includes('token') || key.toLowerCase().includes('key') 
                                            ? '••••••••' 
                                            : String(value)
                                        }
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditChannel(channel)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'gold'
                                  ? 'text-yellow-400 hover:bg-yellow-400/10'
                                  : 'text-blue-600 hover:bg-blue-50'
                              }`}
                              title="Edit channel"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChannel(channel.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'gold'
                                  ? 'text-red-400 hover:bg-red-400/10'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title="Delete channel"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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