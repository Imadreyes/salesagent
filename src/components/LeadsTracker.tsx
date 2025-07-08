import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Filter, 
  Target, 
  TrendingUp, 
  Users, 
  Phone, 
  MessageSquare, 
  Calendar,
  BarChart3,
  Activity,
  Crown,
  Zap
} from 'lucide-react';

interface Campaign {
  id: string;
  offer: string | null;
  status: string | null;
  created_at: string;
}

interface CampaignPerformance {
  campaign: Campaign;
  totalLeads: number;
  sequenceProgress: {
    queued: number;
    running: number;
    done: number;
    failed: number;
  };
  activityStats: {
    calls: number;
    sms: number;
    whatsapp: number;
    bookings: number;
  };
  responseRate: number;
}

export function LeadsTracker() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [performanceData, setPerformanceData] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (user) {
      fetchCampaignPerformance();
    }
  }, [user]);

  const fetchCampaignPerformance = async () => {
    if (!user) return;

    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      const campaigns = campaignsData || [];
      setCampaigns(campaigns);

      // Fetch performance data for each campaign
      const performancePromises = campaigns.map(async (campaign) => {
        // Get total leads from both uploaded_leads and leads tables
        const { data: uploadedLeadsData } = await supabase
          .from('uploaded_leads')
          .select('id')
          .eq('campaign_id', campaign.id);

        const { data: leadsData } = await supabase
          .from('leads')
          .select('id')
          .eq('campaign_id', campaign.id);

        // Get sequence progress
        const { data: sequenceData } = await supabase
          .from('lead_sequence_progress')
          .select('status')
          .eq('campaign_id', campaign.id);

        // Get activity history
        const { data: activityData } = await supabase
          .from('lead_activity_history')
          .select('type, channel_response')
          .eq('campaign_id', campaign.id);

        // Get conversation history for response rate
        const { data: conversationData } = await supabase
          .from('conversation_history')
          .select('from_role')
          .eq('campaign_id', campaign.id);

        // Get bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id')
          .eq('campaign_id', campaign.id);

        // Process sequence progress
        const sequenceProgress = {
          queued: sequenceData?.filter(s => s.status === 'queued').length || 0,
          running: sequenceData?.filter(s => s.status === 'running').length || 0,
          done: sequenceData?.filter(s => s.status === 'done').length || 0,
          failed: sequenceData?.filter(s => s.status === 'failed').length || 0,
        };

        // Process activity stats
        const activityStats = {
          calls: activityData?.filter(a => a.type === 'call' || a.type === 'vapi').length || 0,
          sms: activityData?.filter(a => a.type === 'sms').length || 0,
          whatsapp: activityData?.filter(a => a.type === 'whatsapp').length || 0,
          bookings: bookingsData?.length || 0,
        };

        // Calculate response rate
        const outboundMessages = conversationData?.filter(c => c.from_role === 'ai').length || 0;
        const responses = conversationData?.filter(c => c.from_role === 'lead').length || 0;
        const responseRate = outboundMessages > 0 ? (responses / outboundMessages) * 100 : 0;

        // Calculate total leads from both tables
        const totalLeads = (uploadedLeadsData?.length || 0) + (leadsData?.length || 0);

        return {
          campaign,
          totalLeads,
          sequenceProgress,
          activityStats,
          responseRate,
        };
      });

      const performanceResults = await Promise.all(performancePromises);
      setPerformanceData(performanceResults);
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      // Set empty data on error to prevent infinite loading
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPerformance = performanceData.filter((performance) => {
    const matchesSearch = !searchTerm || 
      (performance.campaign.offer?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !selectedStatus || performance.campaign.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return theme === 'gold' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800';
      case 'paused':
        return theme === 'gold' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return theme === 'gold' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800';
      default:
        return theme === 'gold' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueStatuses = [...new Set(campaigns.map(campaign => campaign.status).filter(Boolean))];

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
            <Activity className="absolute inset-0 m-auto h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          {theme === 'gold' ? (
            <Crown className="h-8 w-8 text-yellow-400" />
          ) : (
            <Activity className="h-8 w-8 text-blue-600" />
          )}
          <h1 className={`text-3xl font-bold ${
            theme === 'gold' ? 'gold-text-gradient' : 'text-gray-900'
          }`}>
            Campaign Performance
          </h1>
        </div>
        <p className={theme === 'gold' ? 'text-gray-400' : 'text-gray-600'}>
          Track the progress and performance of all your campaign sequences
        </p>
      </div>

      {/* Filters */}
      <div className={`rounded-xl shadow-sm border p-4 ${
        theme === 'gold' 
          ? 'black-card gold-border' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                theme === 'gold' ? 'text-yellow-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'gold'
                    ? 'border-yellow-400/30 bg-black/50 text-gray-200 placeholder-gray-500 focus:ring-yellow-400'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
                } focus:border-transparent`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                theme === 'gold'
                  ? 'border-yellow-400/30 bg-black/50 text-gray-200 focus:ring-yellow-400'
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'
              } focus:border-transparent`}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status?.charAt(0).toUpperCase() + status?.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="space-y-4">
        {filteredPerformance.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border ${
            theme === 'gold' 
              ? 'black-card gold-border' 
              : 'bg-white border-gray-200'
          }`}>
            <Activity className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'gold' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
            }`}>
              No campaigns found
            </h3>
            <p className={theme === 'gold' ? 'text-gray-400' : 'text-gray-600'}>
              {searchTerm || selectedStatus
                ? 'Try adjusting your filters'
                : 'Create a campaign to start tracking performance'}
            </p>
          </div>
        ) : (
          filteredPerformance.map((performance) => (
            <div
              key={performance.campaign.id}
              className={`p-6 rounded-xl border transition-all duration-300 ${
                theme === 'gold'
                  ? 'black-card gold-border hover:gold-shadow'
                  : 'bg-white border-gray-200 hover:shadow-lg'
              }`}
            >
              {/* Campaign Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    theme === 'gold' ? 'gold-gradient' : 'bg-blue-100'
                  }`}>
                    <Target className={`h-6 w-6 ${
                      theme === 'gold' ? 'text-black' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {performance.campaign.offer || 'Untitled Campaign'}
                    </h3>
                    <p className={`text-sm ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Created {new Date(performance.campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(performance.campaign.status)}`}>
                  {performance.campaign.status || 'Draft'}
                </span>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${
                  theme === 'gold' ? 'bg-yellow-400/5 border border-yellow-400/20' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className={`h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Total Leads
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                  }`}>
                    {performance.totalLeads}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'gold' ? 'bg-yellow-400/5 border border-yellow-400/20' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Phone className={`h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Calls Made
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
                  }`}>
                    {performance.activityStats.calls}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'gold' ? 'bg-yellow-400/5 border border-yellow-400/20' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className={`h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-purple-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Messages
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    theme === 'gold' ? 'text-yellow-400' : 'text-purple-600'
                  }`}>
                    {performance.activityStats.sms + performance.activityStats.whatsapp}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'gold' ? 'bg-yellow-400/5 border border-yellow-400/20' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className={`h-4 w-4 ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-orange-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Bookings
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    theme === 'gold' ? 'text-yellow-400' : 'text-orange-600'
                  }`}>
                    {performance.activityStats.bookings}
                  </p>
                </div>
              </div>

              {/* Sequence Progress */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${
                  theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Sequence Progress
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
                    }`}>
                      {performance.sequenceProgress.queued}
                    </div>
                    <div className={`text-xs ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Queued
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-orange-600'
                    }`}>
                      {performance.sequenceProgress.running}
                    </div>
                    <div className={`text-xs ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Running
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
                    }`}>
                      {performance.sequenceProgress.done}
                    </div>
                    <div className={`text-xs ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Completed
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      theme === 'gold' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {performance.sequenceProgress.failed}
                    </div>
                    <div className={`text-xs ${
                      theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Failed
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={theme === 'gold' ? 'text-gray-400' : 'text-gray-600'}>
                      Progress
                    </span>
                    <span className={theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'}>
                      {performance.responseRate.toFixed(1)}% Response Rate
                    </span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${
                    theme === 'gold' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-2 rounded-full ${
                        theme === 'gold' ? 'gold-gradient' : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${performance.totalLeads > 0 
                          ? (performance.sequenceProgress.done / performance.totalLeads) * 100 
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}