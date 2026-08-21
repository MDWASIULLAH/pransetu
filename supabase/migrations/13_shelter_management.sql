-- 13_shelter_management.sql

-- 1. Upgrade shelters status column to TEXT for rich operational statuses
ALTER TABLE public.shelters
ALTER COLUMN status TYPE TEXT USING status::text;

-- 2. Rename or ensure current_occupancy column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shelters' AND column_name = 'occupied'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shelters' AND column_name = 'current_occupancy'
    ) THEN
        ALTER TABLE public.shelters RENAME COLUMN occupied TO current_occupancy;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shelters' AND column_name = 'current_occupancy'
    ) THEN
        ALTER TABLE public.shelters ADD COLUMN current_occupancy INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. Add required metadata and facility columns
ALTER TABLE public.shelters
ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'OSDMA',
ADD COLUMN IF NOT EXISTS food_available BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS water_available BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS toilets INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS power TEXT DEFAULT 'GENERATOR',
ADD COLUMN IF NOT EXISTS accessibility TEXT DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS contact_reference TEXT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Enforce strict non-overbooking constraint: occupancy CANNOT exceed capacity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_shelter_occupancy_limit'
    ) THEN
        ALTER TABLE public.shelters
        ADD CONSTRAINT chk_shelter_occupancy_limit 
        CHECK (current_occupancy >= 0 AND current_occupancy <= capacity);
    END IF;
END $$;

-- 5. Atomic displacement intake function with concurrency lock & automatic status transition
CREATE OR REPLACE FUNCTION process_shelter_displacement_intake(
    p_shelter_id TEXT,
    p_displaced_count INTEGER,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_shelter RECORD;
    v_new_occupancy INTEGER;
    v_new_status TEXT;
BEGIN
    -- Lock row for update to ensure atomic concurrency across multiple intake officers
    SELECT * INTO v_shelter
    FROM public.shelters
    WHERE id = p_shelter_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shelter not found: %', p_shelter_id;
    END IF;

    IF v_shelter.status IN ('CLOSED', 'DAMAGED') THEN
        RAISE EXCEPTION 'Cannot intake evacuees into % shelter.', v_shelter.status;
    END IF;

    v_new_occupancy := v_shelter.current_occupancy + p_displaced_count;

    IF v_new_occupancy > v_shelter.capacity THEN
        RAISE EXCEPTION 'CAPACITY_EXCEEDED: Cannot intake % people. Only % capacity remaining.', 
            p_displaced_count, (v_shelter.capacity - v_shelter.current_occupancy);
    END IF;

    -- Dynamic status transition
    IF v_new_occupancy = v_shelter.capacity THEN
        v_new_status := 'FULL';
    ELSIF v_new_occupancy > 0 THEN
        v_new_status := 'PARTIALLY_OCCUPIED';
    ELSE
        v_new_status := 'OPEN';
    END IF;

    -- Update shelter atomically
    UPDATE public.shelters
    SET current_occupancy = v_new_occupancy,
        status = v_new_status,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = p_shelter_id;

    RETURN jsonb_build_object(
        'shelter_id', p_shelter_id,
        'previous_occupancy', v_shelter.current_occupancy,
        'current_occupancy', v_new_occupancy,
        'capacity', v_shelter.capacity,
        'available_capacity', (v_shelter.capacity - v_new_occupancy),
        'occupancy_percentage', ROUND(((v_new_occupancy::NUMERIC / v_shelter.capacity::NUMERIC) * 100), 2),
        'status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
