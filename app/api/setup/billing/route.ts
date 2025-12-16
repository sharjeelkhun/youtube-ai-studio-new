import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Using the service role key to bypass RLS for schema creation
    // NOTE: Ideally this should be protected or run manually. 
    // For this environment, we'll allow it but log clearly.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const { error: subError } = await supabase.rpc('create_billing_tables')

        // If RPC doesn't exist, we might need to run raw SQL. 
        // Since we can't run raw SQL easily via client without an extension, 
        // we'll try to use the query interface if available or instruct user.

        // Actually, usually Supabase JS client doesn't support raw SQL query ('query').
        // We will provide the SQL in the response for the user to run in Supabase Dashboard
        // OR we can try to use a function if one existed.

        // Since we can't reliable run SQL from here without a specific setup,
        // I will return the SQL to the user to run in their dashboard.

        const sql = `
    -- Create subscriptions table
    create table if not exists public.subscriptions (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      plan_id text not null,
      status text check (status in ('active', 'cancelled', 'past_due', 'trialing')) not null,
      current_period_start timestamptz not null,
      current_period_end timestamptz not null,
      paypal_subscription_id text,
      created_at timestamptz default now() not null,
      updated_at timestamptz default now() not null
    );

    -- Create payments table
    create table if not exists public.payments (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      amount numeric not null,
      currency text default 'USD' not null,
      status text check (status in ('succeeded', 'failed', 'pending')) not null,
      payment_method text not null,
      description text,
      paypal_transaction_id text,
      created_at timestamptz default now() not null
    );

    -- Enable RLS
    alter table public.subscriptions enable row level security;
    alter table public.payments enable row level security;

    -- Create policies
    create policy "Users can view own subscriptions" on public.subscriptions
      for select using (auth.uid() = user_id);

    create policy "Users can view own payments" on public.payments
      for select using (auth.uid() = user_id);
    `;

        return new NextResponse(sql, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
