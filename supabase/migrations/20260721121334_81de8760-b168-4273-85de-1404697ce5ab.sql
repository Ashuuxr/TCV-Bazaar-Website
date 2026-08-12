
-- 1. Extend app_role with 'finance'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
