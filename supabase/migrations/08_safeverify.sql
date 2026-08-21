-- 08_safeverify.sql

-- Upgrade safety_records table
ALTER TABLE public.safety_records
ADD COLUMN IF NOT EXISTS block TEXT,
ADD COLUMN IF NOT EXISTS village TEXT,
ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'ANSWERED', -- ANSWERED, NO_ANSWER, FAILED
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'IVR';

-- RPC for High-Performance Dashboard Aggregation
CREATE OR REPLACE FUNCTION get_safeverify_stats(
    p_campaign_id TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_block TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_contacted BIGINT,
    answered BIGINT,
    no_answer BIGINT,
    safe_count BIGINT,
    assistance_count BIGINT,
    trapped_count BIGINT,
    medical_count BIGINT,
    unaccounted_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_contacted,
        COUNT(*) FILTER (WHERE call_status = 'ANSWERED') as answered,
        COUNT(*) FILTER (WHERE call_status = 'NO_ANSWER') as no_answer,
        COUNT(*) FILTER (WHERE state = 'SAFE') as safe_count,
        COUNT(*) FILTER (WHERE state = 'ASSISTANCE') as assistance_count,
        COUNT(*) FILTER (WHERE state = 'TRAPPED') as trapped_count,
        COUNT(*) FILTER (WHERE state = 'MEDICAL') as medical_count,
        COUNT(*) FILTER (WHERE state = 'UNACCOUNTED') as unaccounted_count
    FROM public.safety_records
    WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id)
      AND (p_district IS NULL OR district = p_district)
      AND (p_block IS NULL OR block = p_block);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
