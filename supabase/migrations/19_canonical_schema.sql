-- Align sos_events with Canonical SOS Contract

ALTER TABLE public.sos_events
  RENAME COLUMN id TO sos_id;

ALTER TABLE public.sos_events
  RENAME COLUMN notes TO message;

ALTER TABLE public.sos_events
  ADD COLUMN protocol_version TEXT DEFAULT '1.0' NOT NULL,
  ADD COLUMN priority_score INTEGER,
  ADD COLUMN user_id TEXT,
  ADD COLUMN phone_reference TEXT,
  ADD COLUMN user_name TEXT,
  ADD COLUMN user_phone TEXT,
  ADD COLUMN user_email TEXT;

-- Move citizen_phone data to phone_reference/user_phone if needed, then drop citizen_phone
UPDATE public.sos_events SET user_phone = citizen_phone WHERE citizen_phone IS NOT NULL;

ALTER TABLE public.sos_events
  DROP COLUMN citizen_phone;
