import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Plus, FileText, Link as LinkIcon, Upload, Trash2, Tag, Save, Crown, Zap } from 'lucide-react';

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

    // Basic validation
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (formData.resource_type === 'note' && !formData.content.trim()) {
      alert('Please enter content for the note');
      return;
    }

    if (formData.resource_type === 'link' && !formData.link_url.trim()) {
      alert('Please enter a URL for the link');
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
        resource_type: formData.resource_type,
        title: formData.title || null,
        content: formData.resource_type === 'note' ? formData.content : null,
        link_url: formData.resource_type === 'link' ? formData.link_url : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      };

      console.log('Inserting training resource:', resourceData);

      const { data, error } = await supabase
        .from('training_resources')
        .insert([resourceData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully inserted:', data);

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
        console.warn('Webhook failed, but resource saved:', webhookError);
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
    } catch (error) {
      console.error('Error saving training resource:', error);
      alert(`Failed to save training resource: ${error.message || 'Unknown error'}`);
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === 'gold'
                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your training notes, scripts, objection handling, etc..."
                  required
                />
              </div>
            )}

            {formData.resource_type === 'link' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  URL
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === 'gold'
                      ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                  }`}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'gold'
                    ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                }`}
                placeholder="objections, scripts, pricing, etc..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
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
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-4">
        {resources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'gold' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'gold' ? 'text-gray-300' : 'text-gray-900'
            }`}>
              No training resources yet
            </h3>
            <p className={`text-sm ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Add notes, links, or files to train your AI caller
            </p>
          </div>
        ) : (
          resources.map((resource) => {
            const Icon = getResourceIcon(resource.resource_type);
            return (
              <div
                key={resource.id}
                className={`p-4 rounded-lg border ${
                  theme === 'gold'
                    ? 'border-yellow-400/20 bg-black/10'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      theme === 'gold' ? 'bg-yellow-400/20' : 'bg-blue-100'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {resource.title}
                      </h4>
                      <p className={`text-xs mt-1 ${
                        theme === 'gold' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {new Date(resource.created_at).toLocaleDateString()}
                      </p>
                      
                      {resource.content && (
                        <p className={`text-sm mt-2 ${
                          theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {resource.content.length > 150 
                            ? `${resource.content.substring(0, 150)}...`
                            : resource.content
                          }
                        </p>
                      )}
                      
                      {resource.link_url && (
                        <a
                          href={resource.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm hover:underline ${
                            theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                          }`}
                        >
                          {resource.link_url}
                        </a>
                      )}
                      
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                theme === 'gold'
                                  ? 'bg-yellow-400/20 text-yellow-400'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteResource(resource.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'gold'
                        ? 'text-red-400 hover:bg-red-400/10'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}