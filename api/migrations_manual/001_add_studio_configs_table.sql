-- Migration: add_studio_configs_table
-- Revision ID: 8cffba94b8cc
-- Date: 2025-10-28
-- 
-- Add studio_configs table for persisting studio configuration per user.
-- Replaces the old in-memory _config_state with proper database persistence.

-- Create studio_configs table
CREATE TABLE IF NOT EXISTS studio_configs (
    -- Primary key
    id VARCHAR(36) PRIMARY KEY,
    
    -- Foreign key to user
    user_id VARCHAR(36) NOT NULL,
    
    -- Organization info
    organization_name VARCHAR(255) NOT NULL DEFAULT 'My Organization',
    
    -- Vapi Assistant
    vapi_assistant_id VARCHAR(255),
    
    -- Voice Configuration
    voice_provider VARCHAR(50) NOT NULL DEFAULT '11labs',
    voice_id VARCHAR(255) NOT NULL DEFAULT 'sarah',
    voice_speed FLOAT NOT NULL DEFAULT 1.0,
    
    -- AI Model Configuration
    ai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    ai_temperature FLOAT NOT NULL DEFAULT 0.7,
    ai_max_tokens INTEGER NOT NULL DEFAULT 500,
    
    -- Transcriber Configuration
    transcriber_provider VARCHAR(50) NOT NULL DEFAULT 'deepgram',
    transcriber_model VARCHAR(100) NOT NULL DEFAULT 'nova-2',
    transcriber_language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Conversation Settings
    first_message TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
    guidelines TEXT,
    
    -- Persona & Tone
    persona VARCHAR(100) NOT NULL DEFAULT 'professional',
    tone VARCHAR(100) NOT NULL DEFAULT 'friendly',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Caller Info Collection
    ask_for_name BOOLEAN NOT NULL DEFAULT TRUE,
    ask_for_email BOOLEAN NOT NULL DEFAULT FALSE,
    ask_for_phone BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_studio_configs_user_id ON studio_configs(user_id);

-- Comments for documentation
COMMENT ON TABLE studio_configs IS 'Stores studio configuration per user (voice, AI model, prompts, etc.)';
COMMENT ON COLUMN studio_configs.user_id IS 'User who owns this studio config';
COMMENT ON COLUMN studio_configs.vapi_assistant_id IS 'Vapi assistant ID for syncing';

-- Verification query
SELECT 'studio_configs table created successfully!' AS status;
