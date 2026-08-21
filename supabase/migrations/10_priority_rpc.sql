-- 10_priority_rpc.sql

CREATE OR REPLACE FUNCTION get_incident_priority_context(p_incident_id TEXT)
RETURNS TABLE (
    medical_count INTEGER,
    critical_count INTEGER,
    affected_people INTEGER,
    sos_count INTEGER,
    latest_activity TIMESTAMPTZ,
    nearest_resource_km FLOAT,
    nearest_shelter_km FLOAT
) AS $$
DECLARE
    inc_loc geometry(Point, 4326);
BEGIN
    -- Fetch the incident location
    SELECT location INTO inc_loc
    FROM public.incidents
    WHERE id = p_incident_id;

    RETURN QUERY
    SELECT 
        i.medical_count,
        i.critical_count,
        i.affected_people,
        i.sos_count,
        i.latest_activity,
        (
            SELECT (ST_Distance(r.location::geography, inc_loc::geography) / 1000.0)::FLOAT
            FROM public.resources r
            WHERE r.status = 'AVAILABLE'
            ORDER BY r.location <-> inc_loc
            LIMIT 1
        ) as nearest_resource_km,
        (
            SELECT (ST_Distance(s.location::geography, inc_loc::geography) / 1000.0)::FLOAT
            FROM public.shelters s
            WHERE s.status = 'OPERATIONAL' AND (s.capacity - s.occupied) > 0
            ORDER BY s.location <-> inc_loc
            LIMIT 1
        ) as nearest_shelter_km
    FROM public.incidents i
    WHERE i.id = p_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
