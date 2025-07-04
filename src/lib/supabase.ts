import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          avatar: string | null;
          offer: string | null;
          calendar_url: string | null;
          goal: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          avatar?: string | null;
          offer?: string | null;
          calendar_url?: string | null;
          goal?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          avatar?: string | null;
          offer?: string | null;
          calendar_url?: string | null;
          goal?: string | null;
          status?: string | null;
          created_at?: string;
        };
      };
      uploaded_leads: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          name: string | null;
          phone: string | null;
          email: string | null;
          company_name: string | null;
          job_title: string | null;
          source_url: string | null;
          source_platform: string | null;
          status: string | null;
          booking_url: string | null;
          vapi_call_id: string | null;
          twilio_sms_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          job_title?: string | null;
          source_url?: string | null;
          source_platform?: string | null;
          status?: string | null;
          booking_url?: string | null;
          vapi_call_id?: string | null;
          twilio_sms_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          job_title?: string | null;
          source_url?: string | null;
          source_platform?: string | null;
          status?: string | null;
          booking_url?: string | null;
          vapi_call_id?: string | null;
          twilio_sms_status?: string | null;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          name: string | null;
          phone: string | null;
          status: string | null;
          booking_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          name?: string | null;
          phone?: string | null;
          status?: string | null;
          booking_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string;
          name?: string | null;
          phone?: string | null;
          status?: string | null;
          booking_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};