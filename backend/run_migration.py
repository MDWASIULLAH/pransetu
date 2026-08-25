import os
import sqlalchemy
from sqlalchemy import text

db_url = 'postgresql://postgres:pransetusih2026@db.jdgypmmimxkzamzcqdewk.supabase.co:5432/postgres'
engine = sqlalchemy.create_engine(db_url)

sql = '''
-- Align sos_events with Canonical SOS Contract
ALTER TABLE public.sos_events RENAME COLUMN id TO sos_id;
ALTER TABLE public.sos_events RENAME COLUMN notes TO message;

ALTER TABLE public.sos_events
  ADD COLUMN protocol_version TEXT DEFAULT '1.0' NOT NULL,
  ADD COLUMN priority_score INTEGER,
  ADD COLUMN user_id TEXT,
  ADD COLUMN phone_reference TEXT,
  ADD COLUMN user_name TEXT,
  ADD COLUMN user_phone TEXT,
  ADD COLUMN user_email TEXT;

UPDATE public.sos_events SET user_phone = citizen_phone WHERE citizen_phone IS NOT NULL;
ALTER TABLE public.sos_events DROP COLUMN citizen_phone;
'''

try:
    with engine.begin() as conn:
        conn.execute(text(sql))
    print("MIGRATION SUCCESSFUL!")
except Exception as e:
    print("MIGRATION FAILED:")
    print(e)
