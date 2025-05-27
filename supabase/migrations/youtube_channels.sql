create table if not exists public.youtube_channels (
    id text primary key,
    user_id uuid references auth.users(id) not null,
    title text,
    description text,
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,
    created_at timestamptz default now(),
    last_updated timestamptz default now()
);

-- Set up RLS policies
alter table public.youtube_channels enable row level security;

create policy "Users can view own channels"
    on public.youtube_channels for select
    using (auth.uid() = user_id);

create policy "Users can insert own channels"
    on public.youtube_channels for insert
    with check (auth.uid() = user_id);

create policy "Users can update own channels"
    on public.youtube_channels for update
    using (auth.uid() = user_id);
