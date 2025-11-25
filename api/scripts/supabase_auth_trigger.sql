-- ============================================================================
-- SUPABASE AUTH USER SYNC TRIGGER
-- ============================================================================
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor)
-- This creates a trigger that automatically syncs auth.users to public.users
-- ============================================================================

-- Function to handle new user creation from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_supabase_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        name,
        phone,
        locale,
        supabase_user_id,
        onboarding_completed,
        onboarding_step,
        phone_verified,
        two_fa_enabled,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid()::text,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'locale', 'en'),
        NEW.id::text,
        false,
        0,
        false,
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        supabase_user_id = EXCLUDED.supabase_user_id,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, sign up a new user via Supabase Auth and verify:
-- SELECT * FROM public.users WHERE supabase_user_id IS NOT NULL;
-- ============================================================================
