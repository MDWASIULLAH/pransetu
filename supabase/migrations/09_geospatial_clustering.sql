-- 09_geospatial_clustering.sql

-- Drop existing trigger if it exists to allow idempotent re-runs
DROP TRIGGER IF EXISTS trigger_sos_clustering ON public.sos_events;

-- PostGIS Incremental Clustering Logic
CREATE OR REPLACE FUNCTION process_sos_clustering()
RETURNS TRIGGER AS $$
DECLARE
    matched_incident_id TEXT;
    v_critical_inc INTEGER := 0;
    v_medical_inc INTEGER := 0;
    new_inc_id TEXT;
BEGIN
    -- Skip spatial clustering if:
    -- 1. Incident was already manually assigned.
    -- 2. Location is missing (if schema ever allows nulls in the future).
    IF NEW.incident_id IS NOT NULL OR NEW.location IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate metric increments
    IF NEW.severity IN ('CRITICAL', 'HIGH') THEN
        v_critical_inc := 1;
    END IF;
    IF NEW.medical_required = TRUE THEN
        v_medical_inc := 1;
    END IF;

    -- 1. Nearest Neighbor Search: Find the closest ACTIVE incident within 1000 meters 
    -- that has had activity within the last 12 hours.
    -- Using ::geography for accurate meter-based spatial calculation across the globe.
    SELECT id INTO matched_incident_id
    FROM public.incidents
    WHERE status = 'ACTIVE'
      AND latest_activity >= (NOW() - INTERVAL '12 hours')
      AND ST_DWithin(location::geography, NEW.location::geography, 1000)
    ORDER BY ST_Distance(location::geography, NEW.location::geography) ASC
    LIMIT 1;

    IF matched_incident_id IS NOT NULL THEN
        -- Cluster Merge: Assign the incoming SOS to this incident
        NEW.incident_id := matched_incident_id;

        -- Update the cluster's aggregate metrics
        UPDATE public.incidents
        SET sos_count = sos_count + 1,
            affected_people = affected_people + NEW.people_count,
            critical_count = critical_count + v_critical_inc,
            medical_count = medical_count + v_medical_inc,
            latest_activity = NOW(),
            -- Expand the incident radius if this SOS falls outside the current radius
            radius_km = GREATEST(radius_km, ST_Distance(location::geography, NEW.location::geography) / 1000.0)
        WHERE id = matched_incident_id;

    ELSE
        -- Cluster Formation: Create a brand new incident
        -- Generate a unique, readable Incident ID (e.g. INC-20260821-A3F2)
        new_inc_id := 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
        
        NEW.incident_id := new_inc_id;

        -- Insert the new disaster incident center
        INSERT INTO public.incidents (
            id, district, location, radius_km, sos_count, affected_people, 
            critical_count, medical_count, latest_activity, status
        ) VALUES (
            new_inc_id, 
            'UNKNOWN', -- District will be updated via asynchronous reverse-geocoding worker
            NEW.location,
            0.1, -- 100 meter initial radius
            1, 
            NEW.people_count, 
            v_critical_inc, 
            v_medical_inc, 
            NOW(), 
            'ACTIVE'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger BEFORE INSERT so we can mutate NEW.incident_id
DROP TRIGGER IF EXISTS trigger_sos_clustering ON public.sos_events;
CREATE TRIGGER trigger_sos_clustering
BEFORE INSERT ON public.sos_events
FOR EACH ROW EXECUTE PROCEDURE process_sos_clustering();
