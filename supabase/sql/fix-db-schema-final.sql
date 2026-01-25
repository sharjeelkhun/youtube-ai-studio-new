-- MASTER DATABASE FIX
-- Run this in your Supabase SQL Editor to fix both payments and subscriptions tables

-- 1. Fix Payments Table
ALTER TABLE IF EXISTS public.payments 
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;

-- 2. Fix Subscriptions Table
ALTER TABLE IF EXISTS public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- 3. Ensure RLS is correct for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Ensure RLS is correct for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Refresh schema cache
NOTIFY pgrst, 'reload schema';
