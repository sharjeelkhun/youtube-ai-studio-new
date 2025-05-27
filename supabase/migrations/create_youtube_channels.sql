create table if not exists public.youtube_channels (
    id text primary key,
    user_id uuid references auth.users(id) not null,
    title text,
    description text,
    thumbnail text,
    subscribers bigint default 0,
    video_count bigint default 0,
    view_count bigint default 0,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    last_updated timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Set up RLS policies
alter table public.youtube_channels enable row level security;

create policy "Users can view their own channels"
    on public.youtube_channels for select
    using (auth.uid() = user_id);

create policy "Users can insert their own channels"
    on public.youtube_channels for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own channels"
    on public.youtube_channels for update
    using (auth.uid() = user_id);
