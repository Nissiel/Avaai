-- Migration: create calls table for storing Vapi call metadata

CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  assistant_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_number TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  cost DOUBLE PRECISION,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  transcript TEXT
);

CREATE INDEX IF NOT EXISTS idx_calls_tenant_id_started_at ON calls (tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_assistant_id ON calls (assistant_id);

COMMENT ON TABLE calls IS 'Historical metadata for calls synchronised from Vapi.';
