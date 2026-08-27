-- 22_registered_citizens.sql
-- Stores the registered citizens who have completed onboarding on the Android app.
-- This allows authorities to view all logged-in/registered people and dispatch IVR broadcasts.

CREATE TABLE IF NOT EXISTS public.registered_citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    device_id TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.registered_citizens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated app users to insert/upsert their registration
CREATE POLICY "Allow anonymous app registration"
    ON public.registered_citizens
    FOR INSERT
    WITH CHECK (true);

-- Allow anonymous or authenticated app users to update their registration
CREATE POLICY "Allow anonymous app updates"
    ON public.registered_citizens
    FOR UPDATE
    USING (true);

-- Allow authenticated dashboard users (authorities) to read the list
CREATE POLICY "Authorities can view registered citizens"
    ON public.registered_citizens
    FOR SELECT
    USING (true);

-- Allow authorities to delete (for cleanup)
CREATE POLICY "Authorities can delete citizens"
    ON public.registered_citizens
    FOR DELETE
    USING (true);

-- Add index on phone number for fast lookups
CREATE INDEX IF NOT EXISTS idx_registered_citizens_phone ON public.registered_citizens (phone_number);
