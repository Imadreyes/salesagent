import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Plus, FileText, Link as LinkIcon, Upload, Trash2, Tag, Save, Crown, Zap, CheckCircle, XCircle, TestTube, Phone, MessageSquare, X } from 'lucide-react';

interface TrainingResource {
  id: string;
  resource_type: 'note' | 'file' | 'link';
  title: string | null;
  content: string | null;
  file_url: string | null;
  link_url: string | null;
  tags: string[] | null;
  created_at: string;
}

interface AITrainerProps {
  campaignId?: string;
}

export function AITrainer({ campaignId }: AITrainerProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
  } | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testData, setTestData] = useState({
    phone: '',
    channel: 'call' as 'call' | 'sms' | 'whatsapp'
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    resource_type: 'note' as 'note' | 'file' | 'link',
    title: '',
    content: '',
    link_url: '',
    tags: '',
  });

  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [user, campaignId]);

  const fetchResources = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('training_resources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching training resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Clear any previous errors
    setUploadResult(null);
    
    // Basic validation
    if (!formData.title.trim()) {
      setUploadResult({
        success: false,
        message: 'Please enter a title for your training resource'
      });
      return;
    }

    if (formData.resource_type === 'note' && !formData.content.trim()) {
      setUploadResult({
        success: false,
        message: 'Please enter content for the note'
      });
      return;
    }

    if (formData.resource_type === 'link' && !formData.link_url.trim()) {
      setUploadResult({
        success: false,
        message: 'Please enter a URL for the link'
      });
      return;
    }

    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const resourceData = {
        user_id: user.id,
        campaign_id: campaignId || null,
        type: formData.resource_type, // Updated to match database schema
        content: formData.resource_type === 'link' ? formData.link_url : (formData.resource_type === 'note' ? formData.content : null),
      };

      const { data, error } = await supabase
        .from('training_resources')
        .insert([resourceData])
        .select();

      if (error) {
        throw error;
      }

      // Trigger AI trainer webhook
      try {
        await fetch('https://mazirhx.app.n8n.cloud/webhook/ai-trainer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            campaign_id: campaignId,
            resource: resourceData,
          }),
        });
      } catch (webhookError) {
        // Webhook failure is not critical, resource is still saved
      }

      setFormData({
        resource_type: 'note',
        title: '',
        content: '',
        link_url: '',
        tags: '',
      });
      setShowAddForm(false);
      fetchResources();
      
      setUploadResult({
        success: true,
        message: 'Training resource saved successfully!'
      });
      
      // Clear the success message after 3 seconds
      setTimeout(() => setUploadResult(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadResult({
        success: false,
        message: `Failed to save training resource: ${errorMessage}`,
        errors: error instanceof Error && error.message.includes('column') 
          ? ['Database schema mismatch. Please contact support.']
          : undefined
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('training_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleTestAI = async () => {
    if (!testData.phone.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a phone number'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://mazirhx.app.n8n.cloud/webhook/test-ai-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          campaign_id: campaignId,
          test_phone: testData.phone,
          channel: testData.channel,
          trigger_type: 'ai_training_test',
        }),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Test ${testData.channel} initiated successfully! You should receive a ${testData.channel === 'call' ? 'call' : 'message'} shortly.`
        });
        
        // Auto-close modal after 3 seconds on success
        setTimeout(() => {
          setShowTestModal(false);
          setTestResult(null);
          setTestData({ phone: '', channel: 'call' });
        }, 3000);
      } else {
        throw new Error('Failed to initiate test');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to initiate test ${testData.channel}. Please try again.`
      });
    } finally {
      setTesting(false);
    }
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setTestResult(null);
    setTestData({ phone: '', channel: 'call' });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'note':
        return FileText;
      case 'link':
        return LinkIcon;
      case 'file':
        return Upload;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 border-transparent ${
              theme === 'gold'
                ? 'border-t-yellow-400 border-r-yellow-500'
                : 'border-t-blue-600 border-r-blue-500'
            }`}></div>
            {theme === 'gold' ? (
              <Crown className="absolute inset-0 m-auto h-4 w-4 text-yellow-400" />
            ) : (
              <Zap className="absolute inset-0 m-auto h-4 w-4 text-blue-600" />
            )}
          </div>
        </div>

        {/* Test AI Training Modal */}
        {showTestModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-xl shadow-2xl ${
              theme === 'gold' ? 'black-card gold-border' : 'bg-white border border-gray-200'
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                theme === 'gold' ? 'border-yellow-400/20' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    theme === 'gold' ? 'gold-gradient' : 'bg-blue-100'
                  }`}>
                    <TestTube className={`h-5 w-5 ${
                      theme === 'gold' ? 'text-black' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      Test AI Training
                    </h3>
                    <p className={`text-sm ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Test your AI with real interactions
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeTestModal}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'gold'
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Test Result */}
                {testResult && (
                  <div className={`rounded-lg border p-4 ${
                    testResult.success 
                      ? theme === 'gold'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-green-50 border-green-200 text-green-800'
                      : theme === 'gold'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Number Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testData.phone}
                    onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      theme === 'gold'
                        ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                    }`}
                    placeholder="+1234567890"
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Enter your phone number to receive the test
                  </p>
                </div>

                {/* Channel Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Test Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'call', label: 'Call', icon: Phone },
                      { key: 'sms', label: 'SMS', icon: MessageSquare },
                      { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
                    ].map((channel) => {
                      const Icon = channel.icon;
                      const isSelected = testData.channel === channel.key;
                      return (
                        <button
                          key={channel.key}
                          onClick={() => setTestData({ ...testData, channel: channel.key as any })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                              : theme === 'gold' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <Icon className={`h-5 w-5 ${
                              isSelected
                                ? theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                                : theme === 'gold' ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              isSelected
                                ? theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                                : theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {channel.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closeTestModal}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                      theme === 'gold'
                        ? 'text-gray-400 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                        : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTestAI}
                    disabled={testing || !testData.phone.trim()}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === 'gold'
                        ? 'gold-gradient text-black hover-gold'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {testing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Testing...
                      </div>
                    ) : (
                      `Start Test ${testData.channel === 'call' ? 'Call' : testData.channel.toUpperCase()}`
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className={`p-3 rounded-lg text-xs ${
                  theme === 'gold'
                    ? 'bg-yellow-400/10 border border-yellow-400/20 text-gray-400'
                    : 'bg-blue-50 border border-blue-200 text-blue-600'
                }`}>
                  <p className="font-medium mb-1">💡 Testing Tips:</p>
                  <ul className="space-y-1">
                    <li>• The AI will use your training resources for context</li>
                    <li>• Test different scenarios to improve training</li>
                    <li>• Make sure your phone can receive calls/texts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            AI Training Resources
          </h3>
          <p className={`text-sm ${
            theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Add notes, links, and files to train your AI caller
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            theme === 'gold'
              ? 'gold-gradient text-black hover-gold'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </button>
        <button
          onClick={() => setShowTestModal(true)}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
            theme === 'gold'
              ? 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50'
          }`}
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test AI Training
        </button>
      </div>

      {/* Add Resource Form */}
      {showAddForm && (
        <div className={`p-6 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Resource Type
                </label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as any })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === 'gold'
                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 focus:ring-yellow-400'
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                  }`}
                >
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="file">File (Coming Soon)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === 'gold'
                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                  }`}
                  placeholder="Resource title..."
                  required
                />
              </div>
            </div>

            {formData.resource_type === 'note' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
      {/* Test AI Training Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl ${
            theme === 'gold' ? 'black-card gold-border' : 'bg-white border border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'gold' ? 'border-yellow-400/20' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'gold' ? 'gold-gradient' : 'bg-blue-100'
                }`}>
                  <TestTube className={`h-5 w-5 ${
                    theme === 'gold' ? 'text-black' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Test AI Training
                  </h3>
                  <p className={`text-sm ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Test your AI with real interactions
                  </p>
                </div>
              </div>
              <button
                onClick={closeTestModal}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'gold'
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Test Result */}
              {testResult && (
                <div className={`rounded-lg border p-4 ${
                  testResult.success 
                    ? theme === 'gold'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-green-50 border-green-200 text-green-800'
                    : theme === 'gold'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{testResult.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Number Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Test Phone Number
                </label>
                <input
                  type="tel"
                  value={testData.phone}
                  onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === 'gold'
                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                  }`}
                  placeholder="+1234567890"
                />
                <p className={`text-xs mt-1 ${
                  theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Enter your phone number to receive the test
                </p>
              </div>

              {/* Channel Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Test Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'call', label: 'Call', icon: Phone },
                    { key: 'sms', label: 'SMS', icon: MessageSquare },
                    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
                  ].map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = testData.channel === channel.key;
                    return (
                      <button
                        key={channel.key}
                        onClick={() => setTestData({ ...testData, channel: channel.key as any })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? theme === 'gold'
                              ? 'border-yellow-400 bg-yellow-400/10'
                              : 'border-blue-500 bg-blue-50'
                            : theme === 'gold'
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Icon className={`h-5 w-5 ${
                            isSelected
                              ? theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                              : theme === 'gold' ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            isSelected
                              ? theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                              : theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {channel.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeTestModal}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    theme === 'gold'
                      ? 'text-gray-400 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTestAI}
                  disabled={testing || !testData.phone.trim()}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'gold'
                      ? 'gold-gradient text-black hover-gold'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {testing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Testing...
                    </div>
                  ) : (
                    `Start Test ${testData.channel === 'call' ? 'Call' : testData.channel.toUpperCase()}`
                  )}
                </button>
              </div>

              {/* Info */}
              <div className={`p-3 rounded-lg text-xs ${
                theme === 'gold'
                  ? 'bg-yellow-400/10 border border-yellow-400/20 text-gray-400'
                  : 'bg-blue-50 border border-blue-200 text-blue-600'
              }`}>
                <p className="font-medium mb-1">💡 Testing Tips:</p>
                <ul className="space-y-1">
                  <li>• The AI will use your training resources for context</li>
                  <li>• Test different scenarios to improve training</li>
                  <li>• Make sure your phone can receive calls/texts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            AI Training Resources
          </h3>
          <p className={`text-sm ${
            theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Add notes, links, and files to train your AI caller
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme === 'gold'
                ? 'gold-gradient text-black hover-gold'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
              theme === 'gold'
                ? 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
                : 'border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test AI Training
          </button>
        </div>
      </div>
  );
}