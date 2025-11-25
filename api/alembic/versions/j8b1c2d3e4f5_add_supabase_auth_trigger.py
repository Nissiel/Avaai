"""Add Supabase auth trigger for user sync

Revision ID: j8b1c2d3e4f5
Revises: i7a0b1c2d3e5
Create Date: 2024-11-20 12:00:00.000000

NOTE: This migration creates a trigger that syncs auth.users to public.users.
Since auth.users is a Supabase internal table, this must be run via Supabase SQL Editor.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'j8b1c2d3e4f5'
down_revision = 'i7a0b1c2d3e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create function to handle new user creation from Supabase Auth
    op.execute("""
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
    """)

    # Create trigger on auth.users
    # NOTE: This trigger references auth.users which is a Supabase internal schema
    # It must be run via Supabase SQL Editor, not via Alembic
    op.execute("""
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_supabase_user();")
