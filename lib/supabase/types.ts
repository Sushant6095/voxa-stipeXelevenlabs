/**
 * Voxa — Supabase Database typings.
 *
 * Hand-authored to mirror `supabase/migrations/0001_initial_schema.sql`.
 * The shape follows what `supabase gen types typescript` produces so that
 * once a real project is linked we can drop a regenerated file in place
 * without touching consumers.
 *
 * Regenerate via:
 *   pnpm db:types
 * which expands to:
 *   supabase gen types typescript --linked > lib/supabase/types.ts
 *
 * IMPORTANT: if you change the SQL migration, update this file too —
 * or regenerate from a live project. Drift here will cause silent runtime
 * failures because consumers rely on these types for column names.
 */

// ---------------------------------------------------------------------------
// JSON value type (matches the Supabase generator output)
// ---------------------------------------------------------------------------
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// String literal unions for CHECK constraints
// ---------------------------------------------------------------------------
export type Language = 'en' | 'hi' | 'ta' | 'te';

export type AgentStatus = 'provisioning' | 'active' | 'paused' | 'failed';

export type SubscriptionTier = 'starter' | 'growth' | 'scale';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused';

export type CallStatus = 'in_progress' | 'completed' | 'failed';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'angry';

export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';

// ---------------------------------------------------------------------------
// Database — the shape consumed by `createServerClient<Database>(...)`
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      // ---------------------------------------------------------------------
      // businesses
      // ---------------------------------------------------------------------
      businesses: {
        Row: {
          id: string;
          clerk_user_id: string;
          name: string;
          owner_phone: string | null;
          owner_whatsapp: string | null;
          language: Language;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          name: string;
          owner_phone?: string | null;
          owner_whatsapp?: string | null;
          language?: Language;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          name?: string;
          owner_phone?: string | null;
          owner_whatsapp?: string | null;
          language?: Language;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      // agents
      // ---------------------------------------------------------------------
      agents: {
        Row: {
          id: string;
          business_id: string;
          elevenlabs_agent_id: string | null;
          elevenlabs_voice_id: string | null;
          twilio_number_sid: string | null;
          twilio_phone_e164: string | null;
          status: AgentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          elevenlabs_agent_id?: string | null;
          elevenlabs_voice_id?: string | null;
          twilio_number_sid?: string | null;
          twilio_phone_e164?: string | null;
          status?: AgentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          elevenlabs_agent_id?: string | null;
          elevenlabs_voice_id?: string | null;
          twilio_number_sid?: string | null;
          twilio_phone_e164?: string | null;
          status?: AgentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agents_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------------
      // subscriptions
      // ---------------------------------------------------------------------
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string | null;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------------
      // knowledge_base
      // ---------------------------------------------------------------------
      knowledge_base: {
        Row: {
          id: string;
          business_id: string;
          source_url: string;
          content: string;
          embedded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          source_url: string;
          content: string;
          embedded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          source_url?: string;
          content?: string;
          embedded_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_base_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------------
      // calls
      // ---------------------------------------------------------------------
      calls: {
        Row: {
          id: string;
          agent_id: string;
          business_id: string;
          elevenlabs_conversation_id: string | null;
          caller_phone: string | null;
          duration_seconds: number;
          transcript: Json | null;
          audio_url: string | null;
          language_detected: string | null;
          summary: string | null;
          status: CallStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          business_id: string;
          elevenlabs_conversation_id?: string | null;
          caller_phone?: string | null;
          duration_seconds?: number;
          transcript?: Json | null;
          audio_url?: string | null;
          language_detected?: string | null;
          summary?: string | null;
          status?: CallStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          business_id?: string;
          elevenlabs_conversation_id?: string | null;
          caller_phone?: string | null;
          duration_seconds?: number;
          transcript?: Json | null;
          audio_url?: string | null;
          language_detected?: string | null;
          summary?: string | null;
          status?: CallStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calls_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calls_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------------
      // leads
      // ---------------------------------------------------------------------
      leads: {
        Row: {
          id: string;
          call_id: string | null;
          business_id: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          intent: string | null;
          lead_score: number;
          sentiment: Sentiment | null;
          follow_up_action: string | null;
          status: LeadStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_id?: string | null;
          business_id: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          intent?: string | null;
          lead_score?: number;
          sentiment?: Sentiment | null;
          follow_up_action?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string | null;
          business_id?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          intent?: string | null;
          lead_score?: number;
          sentiment?: Sentiment | null;
          follow_up_action?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_call_id_fkey';
            columns: ['call_id'];
            isOneToOne: false;
            referencedRelation: 'calls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------------
      // stripe_webhook_events (idempotency log, migration 0002)
      // ---------------------------------------------------------------------
      stripe_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          received_at: string;
          payload: Json | null;
        };
        Insert: {
          id: string;
          event_type: string;
          received_at?: string;
          payload?: Json | null;
        };
        Update: {
          id?: string;
          event_type?: string;
          received_at?: string;
          payload?: Json | null;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      // meter_events
      // ---------------------------------------------------------------------
      meter_events: {
        Row: {
          id: string;
          call_id: string;
          business_id: string;
          stripe_event_id: string;
          minutes_billed: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          business_id: string;
          stripe_event_id: string;
          minutes_billed: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          business_id?: string;
          stripe_event_id?: string;
          minutes_billed?: number;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meter_events_call_id_fkey';
            columns: ['call_id'];
            isOneToOne: false;
            referencedRelation: 'calls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meter_events_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      current_clerk_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_business_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      business_minutes_used_this_period: {
        Args: { p_business_id: string };
        Returns: number;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };

    Enums: Record<string, never>;

    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Convenience aliases — import these instead of indexing Database manually.
// ---------------------------------------------------------------------------
export type Business = Database['public']['Tables']['businesses']['Row'];
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert =
  Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate =
  Database['public']['Tables']['subscriptions']['Update'];

export type KnowledgeBaseEntry =
  Database['public']['Tables']['knowledge_base']['Row'];
export type KnowledgeBaseInsert =
  Database['public']['Tables']['knowledge_base']['Insert'];
export type KnowledgeBaseUpdate =
  Database['public']['Tables']['knowledge_base']['Update'];

export type Call = Database['public']['Tables']['calls']['Row'];
export type CallInsert = Database['public']['Tables']['calls']['Insert'];
export type CallUpdate = Database['public']['Tables']['calls']['Update'];

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type MeterEvent = Database['public']['Tables']['meter_events']['Row'];
export type MeterEventInsert =
  Database['public']['Tables']['meter_events']['Insert'];
export type MeterEventUpdate =
  Database['public']['Tables']['meter_events']['Update'];

export type StripeWebhookEvent =
  Database['public']['Tables']['stripe_webhook_events']['Row'];
export type StripeWebhookEventInsert =
  Database['public']['Tables']['stripe_webhook_events']['Insert'];
export type StripeWebhookEventUpdate =
  Database['public']['Tables']['stripe_webhook_events']['Update'];
