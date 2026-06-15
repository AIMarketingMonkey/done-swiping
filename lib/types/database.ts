export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Views: Record<string, { Row: Record<string, unknown> }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          name: string
          date_of_birth: string | null
          gender: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
          subscription_status: 'free' | 'premium' | 'cancelled'
          is_verified: boolean
          is_blocked: boolean
          onboarding_completed: boolean
          onboarding_step: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      user_preferences: {
        Row: {
          user_id: string
          interested_in: string | null
          min_age: number
          max_age: number
          max_distance: number
          relationship_goal: string | null
          has_children_preference: string | null
          smoking_preference: string | null
          drinking_preference: string | null
        }
        Insert: Database['public']['Tables']['user_preferences']['Row']
        Update: Partial<Database['public']['Tables']['user_preferences']['Row']>
      }
      user_profiles: {
        Row: {
          user_id: string
          bio: string | null
          ai_summary: string | null
          public_profile_text: string | null
          profile_completion_score: number
          approved_for_matching: boolean
          last_ai_update: string | null
        }
        Insert: Database['public']['Tables']['user_profiles']['Row']
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      profile_photos: {
        Row: {
          id: string
          user_id: string
          image_url: string
          sort_order: number
          is_primary: boolean
          moderation_status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profile_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profile_photos']['Insert']>
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          conversation_type: 'onboarding' | 'profile_refinement' | 'dating_advice' | 'match_explanation'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          message: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_messages']['Row'], 'id' | 'created_at'>
        Update: never
      }
      structured_profiles: {
        Row: {
          user_id: string
          personality_traits: string[]
          values: string[]
          lifestyle_tags: string[]
          relationship_goal: string | null
          relationship_structure: string | null
          communication_style: string | null
          deal_breakers: string[]
          preferred_partner_traits: string[]
          emotional_readiness: string | null
          attachment_notes: string | null
          love_languages: string[] | null
          sexual_compatibility_notes: string | null
          partner_awareness: string | null
          matching_summary: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['structured_profiles']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['structured_profiles']['Insert']>
      }
      matches: {
        Row: {
          id: string
          user_id: string
          matched_user_id: string
          compatibility_score: number
          match_reason: string | null
          status: 'pending' | 'mutual' | 'expired'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      likes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          status: 'liked' | 'passed' | 'saved'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['likes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['likes']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          last_message_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_text: string
          created_at: string
          read_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          details: string | null
          status: 'pending' | 'reviewed' | 'resolved'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      subscriptions: {
        Row: {
          user_id: string
          plan_name: 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_yearly'
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: 'active' | 'cancelled' | 'past_due'
          renewal_date: string | null
        }
        Insert: Database['public']['Tables']['subscriptions']['Row']
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type ProfilePhoto = Database['public']['Tables']['profile_photos']['Row']
export type AIConversation = Database['public']['Tables']['ai_conversations']['Row']
export type AIMessage = Database['public']['Tables']['ai_messages']['Row']
export type StructuredProfile = Database['public']['Tables']['structured_profiles']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
