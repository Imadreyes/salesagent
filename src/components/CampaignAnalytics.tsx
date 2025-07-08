import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, 
  Phone, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  Calendar,
  Crown,
  Zap,
  Users,
  CheckCircle
} from 'lucide-react';

interface CampaignAnalyticsProps {
  campaignId: string;
}

interface AnalyticsData {
  totalLeads: number;
  callsMade: number;
  smssSent: number;
  whatsappSent: number;
  bookings: number;
  responseRate: number;
  dailyActivity: Array<{
    date: string;
    calls: number;
    sms: number;
    whatsapp: number;
  }>;
}

export function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalLeads: 0,
    callsMade: 0,
    smssSent: 0,
    whatsappSent: 0,
    bookings: 0,
    responseRate: 0,
    dailyActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(now.getDate() - 30);
      } else {
        startDate = new Date('2020-01-01'); // All time
      }

      // Fetch total leads for this campaign
      const { data: leadsData, error: leadsError } = await supabase
        .from('uploaded_leads')
        .select('id')
        .eq('campaign_id', campaignId);

      if (leadsError) throw leadsError;

      // Fetch conversation history for analytics
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString());

      if (conversationError) throw conversationError;

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString());

      if (bookingsError) throw bookingsError;

      // Process data
      const callsMade = conversationData?.filter(c => c.message_type === 'call' && c.direction === 'outbound').length || 0;
      const smssSent = conversationData?.filter(c => c.message_type === 'sms' && c.direction === 'outbound').length || 0;
      const whatsappSent = conversationData?.filter(c => c.message_type === 'whatsapp' && c.direction === 'outbound').length || 0;
      const responsesReceived = conversationData?.filter(c => c.response_received).length || 0;
      const totalOutbound = callsMade + smssSent + whatsappSent;
      const responseRate = totalOutbound > 0 ? (responsesReceived / totalOutbound) * 100 : 0;

      // Generate daily activity data
      const dailyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayConversations = conversationData?.filter(c => 
          c.created_at.startsWith(dateStr) && c.direction === 'outbound'
        ) || [];

        dailyActivity.push({
          date: dateStr,
          calls: dayConversations.filter(c => c.message_type === 'call').length,
          sms: dayConversations.filter(c => c.message_type === 'sms').length,
          whatsapp: dayConversations.filter(c => c.message_type === 'whatsapp').length,
        });
      }

      setAnalytics({
        totalLeads: leadsData?.length || 0,
        callsMade,
        smssSent,
        whatsappSent,
        bookings: bookingsData?.length || 0,
        responseRate,
        dailyActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
            <BarChart3 className="absolute inset-0 m-auto h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>
    );
  }

  const maxDailyValue = Math.max(
    ...analytics.dailyActivity.map(day => day.calls + day.sms + day.whatsapp),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            theme === 'gold' ? 'gold-gradient' : 'bg-blue-100'
          }`}>
            <BarChart3 className={`h-6 w-6 ${
              theme === 'gold' ? 'text-black' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${
              theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Campaign Analytics
            </h3>
            <p className={`text-sm ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Track your campaign performance and outreach activities
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-1">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: 'all', label: 'All Time' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range.key
                  ? theme === 'gold'
                    ? 'gold-gradient text-black'
                    : 'bg-blue-600 text-white'
                  : theme === 'gold'
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
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
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.totalLeads}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Phone className={`h-4 w-4 ${
              theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
            }`} />
            <span className={`text-xs font-medium ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Calls Made
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.callsMade}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className={`h-4 w-4 ${
              theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
            }`} />
            <span className={`text-xs font-medium ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              SMS Sent
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.smssSent}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className={`h-4 w-4 ${
              theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
            }`} />
            <span className={`text-xs font-medium ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              WhatsApp
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.whatsappSent}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className={`h-4 w-4 ${
              theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
            }`} />
            <span className={`text-xs font-medium ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Bookings
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.bookings}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'gold'
            ? 'border-yellow-400/20 bg-black/20'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className={`h-4 w-4 ${
              theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
            }`} />
            <span className={`text-xs font-medium ${
              theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Response Rate
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {analytics.responseRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className={`p-6 rounded-lg border ${
        theme === 'gold'
          ? 'border-yellow-400/20 bg-black/20'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <h4 className={`text-md font-semibold mb-4 ${
          theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
        }`}>
          Daily Activity (Last 7 Days)
        </h4>

        <div className="space-y-4">
          {analytics.dailyActivity.map((day, index) => {
            const total = day.calls + day.sms + day.whatsapp;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {dayName}, {dayDate}
                  </span>
                  <span className={`text-sm ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {total} contacts
                  </span>
                </div>

                <div className="flex space-x-1 h-6">
                  {/* Calls */}
                  {day.calls > 0 && (
                    <div
                      className={`rounded-sm ${
                        theme === 'gold' ? 'bg-yellow-400' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${(day.calls / maxDailyValue) * 100}%`,
                        minWidth: day.calls > 0 ? '4px' : '0'
                      }}
                      title={`${day.calls} calls`}
                    />
                  )}
                  
                  {/* SMS */}
                  {day.sms > 0 && (
                    <div
                      className={`rounded-sm ${
                        theme === 'gold' ? 'bg-yellow-600' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(day.sms / maxDailyValue) * 100}%`,
                        minWidth: day.sms > 0 ? '4px' : '0'
                      }}
                      title={`${day.sms} SMS`}
                    />
                  )}
                  
                  {/* WhatsApp */}
                  {day.whatsapp > 0 && (
                    <div
                      className={`rounded-sm ${
                        theme === 'gold' ? 'bg-orange-400' : 'bg-purple-500'
                      }`}
                      style={{
                        width: `${(day.whatsapp / maxDailyValue) * 100}%`,
                        minWidth: day.whatsapp > 0 ? '4px' : '0'
                      }}
                      title={`${day.whatsapp} WhatsApp`}
                    />
                  )}
                  
                  {total === 0 && (
                    <div className={`w-full h-full rounded-sm ${
                      theme === 'gold' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />
                  )}
                </div>

                <div className="flex space-x-4 text-xs">
                  <span className={`flex items-center ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      theme === 'gold' ? 'bg-yellow-400' : 'bg-blue-500'
                    }`} />
                    {day.calls} calls
                  </span>
                  <span className={`flex items-center ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      theme === 'gold' ? 'bg-yellow-600' : 'bg-green-500'
                    }`} />
                    {day.sms} SMS
                  </span>
                  <span className={`flex items-center ${
                    theme === 'gold' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      theme === 'gold' ? 'bg-orange-400' : 'bg-purple-500'
                    }`} />
                    {day.whatsapp} WhatsApp
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Progress */}
      <div className={`p-6 rounded-lg border ${
        theme === 'gold'
          ? 'border-yellow-400/20 bg-black/20'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <h4 className={`text-md font-semibold mb-4 ${
          theme === 'gold' ? 'text-gray-200' : 'text-gray-900'
        }`}>
          Campaign Progress
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Leads Contacted
            </span>
            <span className={`text-sm font-medium ${
              theme === 'gold' ? 'text-yellow-400' : 'text-blue-600'
            }`}>
              {analytics.callsMade + analytics.smssSent + analytics.whatsappSent} / {analytics.totalLeads}
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
                width: `${analytics.totalLeads > 0 
                  ? ((analytics.callsMade + analytics.smssSent + analytics.whatsappSent) / analytics.totalLeads) * 100 
                  : 0}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              theme === 'gold' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Conversion to Bookings
            </span>
            <span className={`text-sm font-medium ${
              theme === 'gold' ? 'text-yellow-400' : 'text-green-600'
            }`}>
              {analytics.totalLeads > 0 ? ((analytics.bookings / analytics.totalLeads) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}