import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Upload, MessageCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Campaign {
  id: string;
  avatar: string | null;
  offer: string | null;
  calendar_url: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  leadsCount?: number;
  errors?: string[];
}

export function EditCampaign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'leads' | 'chat' | 'schedule'>('details');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [formData, setFormData] = useState({
    offer: '',
    calendar_url: '',
    goal: '',
    status: 'draft',
  });

  useEffect(() => {
    if (id && user) {
      fetchCampaign();
    }
  }, [id, user]);

  const fetchCampaign = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCampaign(data);
        setFormData({
          offer: data.offer || '',
          calendar_url: data.calendar_url || '',
          goal: data.goal || '',
          status: data.status || 'draft',
        });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUploadResult({
        success: true,
        message: 'Campaign updated successfully!'
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      setUploadResult({
        success: false,
        message: 'Error updating campaign. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const leads = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const lead: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || null;
        switch (header) {
          case 'name':
          case 'full_name':
          case 'first_name':
            lead.name = value;
            break;
          case 'phone':
          case 'phone_number':
          case 'mobile':
            lead.phone = value;
            break;
          case 'email':
          case 'email_address':
            lead.email = value;
            break;
          case 'company_name':
          case 'company':
          case 'organization':
            lead.company_name = value;
            break;
          case 'job_title':
          case 'title':
          case 'position':
            lead.job_title = value;
            break;
          case 'source_url':
          case 'url':
          case 'website':
            lead.source_url = value;
            break;
          case 'source_platform':
          case 'platform':
          case 'source':
            lead.source_platform = value;
            break;
        }
      });

      if (lead.name || lead.phone || lead.email) {
        leads.push(lead);
      } else {
        errors.push(`Row ${i + 1}: Missing required data (name, phone, or email)`);
      }
    }

    return { leads, errors };
  };

  const handleFileUpload = async () => {
    if (!csvFile || !user || !campaign) return;

    setUploadLoading(true);
    setUploadResult(null);

    try {
      const csvText = await csvFile.text();
      const { leads, errors } = parseCSV(csvText);

      if (leads.length === 0) {
        setUploadResult({
          success: false,
          message: 'No valid leads found in CSV file.',
          errors: ['Please ensure your CSV has columns for name, phone, or email', ...errors]
        });
        return;
      }

      // Always save leads to database first
      const leadsToInsert = leads.map(lead => ({
        user_id: user.id,
        campaign_id: campaign.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company_name: lead.company_name,
        job_title: lead.job_title,
        source_url: lead.source_url,
        source_platform: lead.source_platform,
        status: 'pending'
      }));

      const { error: dbError } = await supabase
        .from('uploaded_leads')
        .insert(leadsToInsert);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Database save successful - now try N8N webhook (optional)
      let webhookSuccess = false;
      let webhookError = null;

      try {
        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('campaign', JSON.stringify(campaign));
        formData.append('csv', csvFile);

        const response = await fetch('https://mazirhx.app.n8n.cloud/webhook/start-campaign-upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          webhookSuccess = true;
        } else {
          webhookError = `Webhook failed with status: ${response.status}`;
        }
      } catch (error) {
        webhookError = `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // Set success result with webhook status
      setUploadResult({
        success: true,
        message: `Successfully uploaded ${leads.length} leads to the database!`,
        leadsCount: leads.length,
        errors: webhookSuccess ? [] : [
          'Note: Leads saved to database successfully, but automation webhook failed.',
          webhookError || 'Webhook connection failed'
        ]
      });

      setCsvFile(null);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadResult({
        success: false,
        message: 'Failed to upload leads to database.',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearUploadResult = () => {
    setUploadResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Campaign not found
        </h3>
        <Link
          to="/campaigns"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/campaigns"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.offer || 'Untitled Campaign'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Campaign ID: {campaign.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            campaign.status === 'active'
              ? 'bg-green-100 text-green-800'
              : campaign.status === 'paused'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {campaign.status || 'Draft'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Upload Result Message */}
      {uploadResult && (
        <div className={`rounded-lg border p-4 ${
          uploadResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                uploadResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadResult.message}
              </h3>
              {uploadResult.leadsCount && (
                <p className="text-sm text-green-700 mt-1">
                  {uploadResult.leadsCount} leads have been added to your database and are ready for outreach.
                </p>
              )}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-1" />
                    <span className="text-sm font-medium text-yellow-800">Additional Information:</span>
                  </div>
                  <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={clearUploadResult}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaign Details
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Leads
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Training AI Center
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedule
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Campaign Details Tab */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="offer" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Offer *
                  </label>
                  <input
                    type="text"
                    id="offer"
                    name="offer"
                    value={formData.offer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Free consultation call"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your campaign objectives..."
                />
              </div>

              <div>
                <label htmlFor="calendar_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar URL *
                </label>
                <input
                  type="url"
                  id="calendar_url"
                  name="calendar_url"
                  value={formData.calendar_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://calendly.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
            </form>
          )}

          {/* Upload Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload a CSV file with your leads data. Supported columns: name, phone, email, company_name, job_title, source_url, source_platform
                </p>
                
                <div className="max-w-md mx-auto space-y-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setCsvFile(e.target.files?.[0] || null);
                      setUploadResult(null); // Clear previous results
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={handleFileUpload}
                    disabled={!csvFile || uploadLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </div>
                    ) : (
                      'Upload CSV File'
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-500 mt-4 space-y-1">
                  <p>• CSV files only with comma-separated values</p>
                  <p>• First row should contain column headers</p>
                  <p>• At least one of: name, phone, or email is required per row</p>
                </div>
              </div>
            </div>
          )}

          {/* Training AI Center Tab */}
          {activeTab === 'chat' && (
            <div className="h-96 flex flex-col">
              <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Training AI Center
                  </h3>
                  <p className="text-gray-600">
                    🚧 Coming soon: Train your AI caller agent using conversational prompts and sequences.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message to train the AI..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
                <button
                  disabled
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    defaultValue="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of contacts per day</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                    <option>CST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours Start
                  </label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours End
                  </label>
                  <input
                    type="time"
                    defaultValue="17:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={day !== 'Sat' && day !== 'Sun'}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Schedule Summary</h4>
                <p className="text-sm text-blue-700">
                  Campaign will start on TBD at TBD. Up to 50 contacts will be reached per day during working hours (09:00 - 17:00) on Monday, Tuesday, Wednesday, Thursday, Friday.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}