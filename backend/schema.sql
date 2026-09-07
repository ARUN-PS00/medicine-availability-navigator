--------------------------------------------------------------------------------
-- MEDICINE AVAILABILITY NAVIGATOR - SUPABASE POSTGRESQL SCHEMA
-- Phase P5.2 Schema Implementation
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- 1. FACILITIES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.facilities (
    id VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('District Hospital', 'CHC', 'PHC', 'Pharmacy')),
    latitude NUMERIC(8, 4) NOT NULL,
    longitude NUMERIC(8, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--------------------------------------------------------------------------------
-- 2. MEDICINES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medicines (
    id VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--------------------------------------------------------------------------------
-- 3. INVENTORY TIME-SERIES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    facility_id VARCHAR(10) NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    medicine_id VARCHAR(10) NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_stock INTEGER NOT NULL DEFAULT 0 CHECK (opening_stock >= 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    dispensed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (dispensed_quantity >= 0),
    closing_stock INTEGER NOT NULL DEFAULT 0 CHECK (closing_stock >= 0),
    days_since_restock INTEGER NOT NULL DEFAULT 0 CHECK (days_since_restock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Enforce unique daily record per facility and medicine
    CONSTRAINT uq_inventory_facility_medicine_date UNIQUE (facility_id, medicine_id, date),

    -- Enforce fundamental inventory accounting balance equation
    CONSTRAINT chk_inventory_balance_equation CHECK (opening_stock + received_quantity - dispensed_quantity = closing_stock)
);

--------------------------------------------------------------------------------
-- INDEXES FOR TIME-SERIES AGGREGATIONS & ROLLING CALCULATIONS
--------------------------------------------------------------------------------
-- Composite index for rolling feature engineering queries (grouped by facility + medicine sorted by date)
CREATE INDEX IF NOT EXISTS idx_inventory_fac_med_date 
    ON public.inventory (facility_id, medicine_id, date ASC);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_inventory_date 
    ON public.inventory (date DESC);
