CREATE TYPE incident_status AS ENUM ('ACTIVE', 'RESCUE_DISPATCHED', 'RESOLVED');
CREATE TYPE resource_status AS ENUM ('AVAILABLE', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'UNAVAILABLE');
CREATE TYPE resource_type AS ENUM ('RESCUE_TEAM', 'AMBULANCE', 'BOAT', 'MEDICAL_TEAM');
CREATE TYPE shelter_status AS ENUM ('OPERATIONAL', 'FULL', 'CLOSED');

CREATE TABLE IF NOT EXISTS public.incidents (
    id TEXT PRIMARY KEY,
    district TEXT NOT NULL,
    location geometry(Point, 4326) NOT NULL,
    radius_km FLOAT NOT NULL,
    sos_count INTEGER NOT NULL DEFAULT 1,
    affected_people INTEGER NOT NULL DEFAULT 1,
    critical_count INTEGER NOT NULL DEFAULT 0,
    medical_count INTEGER NOT NULL DEFAULT 0,
    latest_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    priority_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    status incident_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_incidents_modtime
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE INDEX incidents_location_idx ON public.incidents USING GIST (location);

CREATE TABLE IF NOT EXISTS public.resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type resource_type NOT NULL,
    status resource_status NOT NULL DEFAULT 'AVAILABLE',
    capacity INTEGER,
    members INTEGER,
    medical_capability TEXT,
    location geometry(Point, 4326) NOT NULL,
    assigned_incident_id TEXT REFERENCES public.incidents(id),
    eta_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_resources_modtime
BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE INDEX resources_location_idx ON public.resources USING GIST (location);

CREATE TABLE IF NOT EXISTS public.shelters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    location geometry(Point, 4326) NOT NULL,
    capacity INTEGER NOT NULL,
    occupied INTEGER NOT NULL DEFAULT 0,
    facilities TEXT[],
    medical_capability BOOLEAN NOT NULL DEFAULT FALSE,
    status shelter_status NOT NULL DEFAULT 'OPERATIONAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_shelters_modtime
BEFORE UPDATE ON public.shelters
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE INDEX shelters_location_idx ON public.shelters USING GIST (location);

CREATE TABLE IF NOT EXISTS public.rescue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id TEXT NOT NULL REFERENCES public.incidents(id),
    resource_id TEXT NOT NULL REFERENCES public.resources(id),
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status resource_status NOT NULL DEFAULT 'EN_ROUTE',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.disaster_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    polygon geometry(Polygon, 4326) NOT NULL,
    severity sos_severity NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX disaster_zones_polygon_idx ON public.disaster_zones USING GIST (polygon);
