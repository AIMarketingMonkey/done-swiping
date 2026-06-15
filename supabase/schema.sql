-- Done Swiping — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor to set up all tables

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  location TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'cancelled')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step TEXT
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  interested_in TEXT,
  min_age INT NOT NULL DEFAULT 18,
  max_age INT NOT NULL DEFAULT 99,
  max_distance INT NOT NULL DEFAULT 50,
  relationship_goal TEXT,
  has_children_preference TEXT,
  smoking_preference TEXT,
  drinking_preference TEXT
);

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  ai_summary TEXT,
  public_profile_text TEXT,
  profile_completion_score INT NOT NULL DEFAULT 0,
  approved_for_matching BOOLEAN NOT NULL DEFAULT FALSE,
  last_ai_update TIMESTAMPTZ
);

-- ============================================================
-- PROFILE PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (conversation_type IN ('onboarding', 'profile_refinement', 'dating_advice', 'match_explanation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STRUCTURED PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.structured_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  personality_traits TEXT[] NOT NULL DEFAULT '{}',
  values TEXT[] NOT NULL DEFAULT '{}',
  lifestyle_tags TEXT[] NOT NULL DEFAULT '{}',
  relationship_goal TEXT,
  communication_style TEXT,
  deal_breakers TEXT[] NOT NULL DEFAULT '{}',
  preferred_partner_traits TEXT[] NOT NULL DEFAULT '{}',
  emotional_readiness TEXT,
  attachment_notes TEXT,
  sexual_compatibility_notes TEXT,
  relationship_structure TEXT,
  partner_awareness TEXT,
  matching_summary TEXT,
  embedding_vector vector(1536),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compatibility_score INT NOT NULL DEFAULT 0,
  match_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mutual', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, matched_user_id)
);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('liked', 'passed', 'saved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================================
-- CONVERSATIONS (MESSAGING)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_name IN ('free', 'premium_monthly', 'premium_quarterly', 'premium_yearly')),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  renewal_date TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structured_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "prefs_own" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "profiles_own" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "photos_own" ON public.profile_photos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_convs_own" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_msgs_own" ON public.ai_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "struct_own" ON public.structured_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subs_own" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Matches: users see their own matches; can read basic info of matched user
CREATE POLICY "matches_own" ON public.matches FOR ALL USING (auth.uid() = user_id);

-- Likes: users can read/write their own likes; can see likes they've received
CREATE POLICY "likes_from" ON public.likes FOR ALL USING (auth.uid() = from_user_id);
CREATE POLICY "likes_to_read" ON public.likes FOR SELECT USING (auth.uid() = to_user_id);

-- Approved public profiles readable by all authenticated users for matching
CREATE POLICY "profiles_public_read" ON public.user_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND approved_for_matching = TRUE);
CREATE POLICY "users_public_read" ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_blocked = FALSE);
CREATE POLICY "photos_public_read" ON public.profile_photos FOR SELECT
  USING (auth.uid() IS NOT NULL AND moderation_status = 'approved');
CREATE POLICY "struct_public_read" ON public.structured_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Conversations: both parties can read/write
CREATE POLICY "convs_participant" ON public.conversations FOR ALL
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "msgs_participant" ON public.messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ));

-- Reports: users can create
CREATE POLICY "reports_create" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ai_convs_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
