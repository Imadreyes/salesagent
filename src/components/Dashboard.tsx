import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Users, Target, Calendar, TrendingUp, Crown, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Campaign {
  id: string;
  avatar: string | null;
  offer: string | null;
  calendar_url: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
}

interface DashboardStats {
  totalCampaigns: number;
  totalLeads: number;
  bookedLeads: number;
  activeLeads: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    bookedLeads: 0,
    activeLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (campaignsError) throw campaignsError;

      // Fetch stats
      const [campaignsCount, leadsCount, bookedCount] = await Promise.all([
        supabase
          .from('campaigns')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('uploaded_leads')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ]);

      const activeLeadsCount = await supabase
        .from('uploaded_leads')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'called', 'contacted']);

      setCampaigns(campaignsData || []);
      setStats({
        totalCampaigns: campaignsCount.count || 0,
        totalLeads: leadsCount.count || 0,
        bookedLeads: bookedCount.count || 0,
        activeLeads: activeLeadsCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-yellow-400 border-r-yellow-500"></div>
          <Crown className="absolute inset-0 m-auto h-4 w-4 text-yellow-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold gold-text-gradient">Elite Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Welcome back, <span className="text-yellow-400 font-medium">{user?.user_metadata?.full_name || user?.email}</span>
          </p>
        </div>
        <Link
          to="/campaigns"
          className="inline-flex items-center px-6 py-3 gold-gradient text-black text-sm font-bold rounded-lg hover-gold transition-all duration-200 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="black-card p-6 rounded-xl gold-border hover:gold-shadow transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 gold-gradient rounded-lg shadow-lg">
              <Target className="h-6 w-6 text-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-400">
                {stats.totalCampaigns}
              </p>
              <p className="text-sm text-gray-400">Elite Campaigns</p>
            </div>
          </div>
        </div>

        <div className="black-card p-6 rounded-xl gold-border hover:gold-shadow transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 gold-gradient rounded-lg shadow-lg">
              <Users className="h-6 w-6 text-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-400">
                {stats.totalLeads}
              </p>
              <p className="text-sm text-gray-400">Premium Leads</p>
            </div>
          </div>
        </div>

        <div className="black-card p-6 rounded-xl gold-border hover:gold-shadow transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 gold-gradient rounded-lg shadow-lg">
              <Calendar className="h-6 w-6 text-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-400">
                {stats.bookedLeads}
              </p>
              <p className="text-sm text-gray-400">Booked Meetings</p>
            </div>
          </div>
        </div>

        <div className="black-card p-6 rounded-xl gold-border hover:gold-shadow transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 gold-gradient rounded-lg shadow-lg">
              <TrendingUp className="h-6 w-6 text-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-400">
                {stats.activeLeads}
              </p>
              <p className="text-sm text-gray-400">Active Pipeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="black-card rounded-xl gold-border shadow-2xl">
        <div className="px-6 py-4 border-b border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-200">
                Recent Elite Campaigns
              </h2>
            </div>
            <Link
              to="/campaigns"
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Target className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">
                Ready to dominate your market?
              </h3>
              <p className="text-gray-400 mb-6">
                Create your first elite campaign and start converting high-value leads.
              </p>
              <Link
                to="/campaigns"
                className="inline-flex items-center px-6 py-3 gold-gradient text-black text-sm font-bold rounded-lg hover-gold transition-all duration-200 shadow-lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Launch Elite Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border border-yellow-400/20 rounded-lg hover:bg-yellow-400/5 transition-all duration-200 hover:border-yellow-400/40"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gold-gradient rounded-lg flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-200">
                        {campaign.offer || 'Elite Campaign'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {campaign.goal || 'Premium outreach strategy'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {campaign.status === 'active' && <Zap className="h-3 w-3 mr-1" />}
                      {campaign.status || 'Draft'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}