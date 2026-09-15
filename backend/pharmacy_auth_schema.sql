--------------------------------------------------------------------------------
-- PHARMACY AUTHENTICATION SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- MAP Pharmacy Supabase Auth Integration (Production Hardened)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- 1. PHARMACY PROFILES TABLE
-- Associates Supabase auth.users UUID with MAP facilities.id (e.g. 'F001')
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pharmacy_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id VARCHAR(10) NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT uq_pharmacy_profiles_facility UNIQUE (facility_id)
);

-- Index on facility_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_facility_id
    ON public.pharmacy_profiles (facility_id);

--------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable Row Level Security on pharmacy_profiles
ALTER TABLE public.pharmacy_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view ONLY their own profile
CREATE POLICY "Users can view own pharmacy profile"
    ON public.pharmacy_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- SECURITY ENFORCEMENT:
-- NO INSERT, UPDATE, or DELETE policies are granted to public/authenticated users for pharmacy_profiles.
-- Profile creation and facility mapping MUST be performed exclusively server-side by the backend API using the Supabase service_role key.

-- Enable Row Level Security on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access to inventory (for client search functionality)
CREATE POLICY "Public read inventory"
    ON public.inventory
    FOR SELECT
    USING (true);

-- RLS Policy: Authenticated pharmacy users can insert/update inventory ONLY for their assigned facility
CREATE POLICY "Pharmacy users modify own facility inventory"
    ON public.inventory
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pharmacy_profiles
            WHERE pharmacy_profiles.id = auth.uid()
            AND pharmacy_profiles.facility_id = inventory.facility_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pharmacy_profiles
            WHERE pharmacy_profiles.id = auth.uid()
            AND pharmacy_profiles.facility_id = inventory.facility_id
        )
    );
