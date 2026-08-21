-- 12_resource_registration.sql

-- 1. Add verification and agency metadata columns to public.resources
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS agency_type TEXT NOT NULL DEFAULT 'GOVERNMENT',
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Ensure existing seeded records are marked as VERIFIED
UPDATE public.resources
SET verification_status = 'VERIFIED'
WHERE verification_status = 'PENDING' AND status = 'AVAILABLE';

-- 3. Indexes for fast status filtering
CREATE INDEX IF NOT EXISTS idx_resources_verification_status ON public.resources(verification_status);
CREATE INDEX IF NOT EXISTS idx_resources_agency_type ON public.resources(agency_type);
