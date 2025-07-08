import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Phone, 
  MessageSquare, 
  Zap,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  X
} from 'lucide-react';

interface Channel {
  id: string;
  provider: string;
  channel_type: string;
  sender_id: string | null;
  is_active: boolean;
  usage_count: number;
  max_usage: number;
  created_at: string;
}

interface TwilioSettings {
  id?: string;
  twilio_sid: string;
  twilio_auth_token: string;
  sms_number: string | null;
  whatsapp_number: string | null;
  vapi_number: string | null;
}

export function Settings() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [twilioSettings, setTwilioSettings] = useState<TwilioSettings>({
    twilio_sid: '',
    twilio_auth_token: '',
    sms_number: null,
    whatsapp_number: null,
    vapi_number: null
  });

  // Profile settings
  const [fullName, setFullName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadChannels();
      loadTwilioSettings();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadTwilioSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_twilio_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setTwilioSettings(data);
      }
    } catch (error) {
      console.error('Error loading Twilio settings:', error);
    }
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user?.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const saveTwilioSettings = async () => {
    setLoading(true);
    try {
      if (twilioSettings.id) {
        const { error } = await supabase
          .from('user_twilio_settings')
          .update(twilioSettings)
          .eq('id', twilioSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_twilio_settings')
          .insert({ ...twilioSettings, user_id: user?.id });
        if (error) throw error;
      }
      alert('Twilio settings saved successfully!');
      loadTwilioSettings();
    } catch (error) {
      console.error('Error saving Twilio settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'channels', label: 'Channels', icon: MessageSquare },
    { id: 'integrations', label: 'Integrations', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={`rounded-xl shadow-sm border ${
        theme === 'gold' 
          ? 'black-card gold-border' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={updateProfile}
                  disabled={profileLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <ChannelsManager channels={channels} onChannelsChange={loadChannels} />
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Twilio Integration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={twilioSettings.twilio_sid}
                    onChange={(e) => setTwilioSettings(prev => ({ ...prev, twilio_sid: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth Token
                  </label>
                  <input
                    type="password"
                    value={twilioSettings.twilio_auth_token}
                    onChange={(e) => setTwilioSettings(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your auth token"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Number
                  </label>
                  <input
                    type="tel"
                    value={twilioSettings.sms_number || ''}
                    onChange={(e) => setTwilioSettings(prev => ({ ...prev, sms_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={twilioSettings.whatsapp_number || ''}
                    onChange={(e) => setTwilioSettings(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAPI Number
                  </label>
                  <input
                    type="tel"
                    value={twilioSettings.vapi_number || ''}
                    onChange={(e) => setTwilioSettings(prev => ({ ...prev, vapi_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveTwilioSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelsManager({ channels, onChannelsChange }: { channels: Channel[], onChannelsChange: () => void }) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [newChannel, setNewChannel] = useState({
    provider: '',
    channel_type: '',
    sender_id: '',
    max_usage: 100
  });

  const addChannel = async () => {
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          ...newChannel,
          user_id: user?.id,
          credentials: {}
        });

      if (error) throw error;
      
      setNewChannel({
        provider: '',
        channel_type: '',
        sender_id: '',
        max_usage: 100
      });
      setShowAddForm(false);
      onChannelsChange();
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Error adding channel');
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      onChannelsChange();
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Error deleting channel');
    }
  };

  const toggleChannelStatus = async (channelId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('channels')
        .update({ is_active: !isActive })
        .eq('id', channelId);

      if (error) throw error;
      onChannelsChange();
    } catch (error) {
      console.error('Error updating channel:', error);
      alert('Error updating channel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Communication Channels</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Channel</span>
        </button>
      </div>

      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Add New Channel</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={newChannel.provider}
                onChange={(e) => setNewChannel(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Provider</option>
                <option value="twilio">Twilio</option>
                <option value="vapi">VAPI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
              <select
                value={newChannel.channel_type}
                onChange={(e) => setNewChannel(prev => ({ ...prev, channel_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Type</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="voice">Voice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
              <input
                type="text"
                value={newChannel.sender_id}
                onChange={(e) => setNewChannel(prev => ({ ...prev, sender_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Phone number or sender ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage</label>
              <input
                type="number"
                value={newChannel.max_usage}
                onChange={(e) => setNewChannel(prev => ({ ...prev, max_usage: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={addChannel}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Channel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {channel.provider} - {channel.channel_type}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    channel.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Sender: {channel.sender_id || 'Not set'}
                </p>
                <p className="text-sm text-gray-600">
                  Usage: {channel.usage_count} / {channel.max_usage}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleChannelStatus(channel.id, channel.is_active)}
                  className={`p-2 rounded-md ${
                    channel.is_active 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={channel.is_active ? 'Deactivate' : 'Activate'}
                >
                  {channel.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteChannel(channel.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Delete channel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {channels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No channels configured yet.</p>
            <p className="text-sm">Add a channel to start sending messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}