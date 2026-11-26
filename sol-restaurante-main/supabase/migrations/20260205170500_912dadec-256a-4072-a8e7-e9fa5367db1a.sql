-- Step 1: Add new roles to the enum (this must be committed first)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cozinha';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'estoque';