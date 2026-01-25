-- FORCE SINGLE SUBSCRIPTION PER USER
-- 1. Remove duplicates (keep the newest one for each user)
DELETE FROM public.subscriptions a
USING public.subscriptions b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- 2. Add Unique Constraint to user_id (if not exists)
-- This ensures .upsert(..., {onConflict: 'user_id'}) always works correctly
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- 3. Cleanup Payments (Optional but recommended to check for double-records)
-- No unique constraint on payments as multiple months/switches are valid.

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
